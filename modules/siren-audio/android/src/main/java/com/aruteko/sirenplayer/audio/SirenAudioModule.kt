package com.aruteko.sirenplayer.audio

import android.content.ComponentName
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.core.net.toUri
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.google.common.util.concurrent.ListenableFuture
import com.google.common.util.concurrent.MoreExecutors
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/** JS から再生サービスを操作する橋渡し．時間の単位はすべてミリ秒． */
class SirenAudioModule : Module() {

    private val mainHandler = Handler(Looper.getMainLooper())
    private var controllerFuture: ListenableFuture<MediaController>? = null
    private var player: Player? = null

    private val serviceListener: (SirenMusicService) -> Unit = { service ->
        mainHandler.post {
            val servicePlayer = service.player
            if (servicePlayer != null && player !== servicePlayer) {
                player?.removeListener(playerListener)
                player = servicePlayer
                servicePlayer.addListener(playerListener)
                updatePositionPolling()
            }
        }
    }

    private val playerListener = object : Player.Listener {
        override fun onIsPlayingChanged(isPlaying: Boolean) {
            sendEvent("onIsPlayingChanged", mapOf("isPlaying" to isPlaying))
            updatePositionPolling()
        }

        override fun onPlaybackStateChanged(playbackState: Int) {
            sendEvent("onPlaybackStateChanged", mapOf("state" to playbackState))
            updatePositionPolling()
        }

        override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
            sendEvent(
                "onTrackChanged",
                mapOf(
                    "id" to (mediaItem?.mediaId ?: ""),
                    "index" to (player?.currentMediaItemIndex ?: -1),
                ),
            )
        }

        override fun onRepeatModeChanged(repeatMode: Int) {
            sendEvent("onModeChanged", mapOf("repeatMode" to repeatMode))
        }

        override fun onShuffleModeEnabledChanged(shuffleModeEnabled: Boolean) {
            sendEvent("onModeChanged", mapOf("shuffle" to shuffleModeEnabled))
        }

        override fun onPlayerError(error: PlaybackException) {
            sendEvent(
                "onPlayerError",
                mapOf(
                    "code" to error.errorCodeName,
                    "message" to (error.cause?.message ?: error.message ?: ""),
                ),
            )
        }
    }

    private val positionRunnable = object : Runnable {
        override fun run() {
            val p = player ?: return
            if (p.isPlaying) {
                sendEvent("onPositionUpdate", positionMap(p))
                mainHandler.postDelayed(this, POSITION_INTERVAL_MS)
            }
        }
    }

    private fun positionMap(p: Player): Map<String, Any> = mapOf(
        "position" to p.currentPosition,
        "duration" to if (p.duration == C.TIME_UNSET) 0L else p.duration,
        "buffered" to p.bufferedPosition,
    )

    private fun updatePositionPolling() {
        mainHandler.removeCallbacks(positionRunnable)
        if (player?.isPlaying == true) mainHandler.post(positionRunnable)
    }

    private fun itemToMap(item: MediaItem): Map<String, Any?> = mapOf(
        "id" to item.mediaId,
        "title" to item.mediaMetadata.title?.toString(),
        "artist" to item.mediaMetadata.artist?.toString(),
        "album" to item.mediaMetadata.albumTitle?.toString(),
        "artwork" to item.mediaMetadata.artworkUri?.toString(),
    )

    private fun mapToItem(track: Map<String, Any?>): MediaItem {
        val id = track["id"] as? String ?: throw CodedException("Track without id")
        val metadata = MediaMetadata.Builder()
            .setTitle(track["title"] as? String)
            .setArtist(track["artist"] as? String)
            .setAlbumTitle(track["album"] as? String)
            .setArtworkUri((track["artwork"] as? String)?.takeIf { it.isNotEmpty() }?.toUri())
            .setIsPlayable(true)
            .setExtras(Bundle().apply { putString("cid", id) })
            .build()
        return MediaItem.Builder()
            .setMediaId(id)
            .setUri("${SirenSourceResolver.SCHEME}://song/$id")
            .setMediaMetadata(metadata)
            .build()
    }

    /** MediaController を作ることで，再生サービスを起動して結びつける． */
    private suspend fun awaitService() {
        val future = controllerFuture ?: throw CodedException("The audio module is not ready")
        suspendCancellableCoroutine { continuation ->
            future.addListener({
                try {
                    future.get()
                    if (continuation.isActive) continuation.resume(Unit)
                } catch (error: Exception) {
                    if (continuation.isActive) continuation.resumeWithException(error.cause ?: error)
                }
            }, MoreExecutors.directExecutor())
        }
    }

    private suspend fun <T> withPlayer(block: (Player) -> T): T {
        awaitService()
        return withContext(Dispatchers.Main.immediate) {
            val service = SirenMusicService.instance ?: throw CodedException("The player service is not running")
            val servicePlayer = service.player ?: throw CodedException("The player is not available")
            if (player !== servicePlayer) {
                player?.removeListener(playerListener)
                player = servicePlayer
                servicePlayer.addListener(playerListener)
            }
            block(servicePlayer)
        }
    }

    override fun definition() = ModuleDefinition {
        Name("SirenAudio")

        Events(
            "onIsPlayingChanged",
            "onPlaybackStateChanged",
            "onTrackChanged",
            "onModeChanged",
            "onPositionUpdate",
            "onPlayerError",
        )

        OnCreate {
            val context = appContext.reactContext ?: return@OnCreate
            val token = SessionToken(context, ComponentName(context, SirenMusicService::class.java))
            controllerFuture = MediaController.Builder(context, token)
                .setApplicationLooper(Looper.getMainLooper())
                .buildAsync()
            SirenMusicService.addOnServiceReadyListener(serviceListener)
        }

        OnDestroy {
            mainHandler.post {
                mainHandler.removeCallbacks(positionRunnable)
                controllerFuture?.let { MediaController.releaseFuture(it) }
                controllerFuture = null
                SirenMusicService.removeOnServiceReadyListener(serviceListener)
                player?.removeListener(playerListener)
                player = null
            }
        }

        AsyncFunction("setQueue") Coroutine { tracks: List<Map<String, Any?>>, startIndex: Int, playWhenReady: Boolean ->
            withPlayer { p ->
                p.setMediaItems(tracks.map(::mapToItem), startIndex, 0L)
                p.prepare()
                p.playWhenReady = playWhenReady
            }
        }

        AsyncFunction("play") Coroutine { ->
            withPlayer { p ->
                if (p.playbackState == Player.STATE_IDLE && p.mediaItemCount > 0) p.prepare()
                p.play()
            }
        }

        AsyncFunction("pause") Coroutine { -> withPlayer { it.pause() } }

        AsyncFunction("skipTo") Coroutine { index: Int ->
            withPlayer { p ->
                p.seekTo(index, 0L)
                p.play()
            }
        }

        AsyncFunction("skipToNext") Coroutine { -> withPlayer { it.seekToNext() } }

        AsyncFunction("skipToPrevious") Coroutine { -> withPlayer { it.seekToPrevious() } }

        AsyncFunction("seekTo") Coroutine { positionMs: Double ->
            withPlayer { it.seekTo(positionMs.toLong()) }
        }

        AsyncFunction("setRepeatMode") Coroutine { mode: Int ->
            withPlayer { it.repeatMode = mode }
        }

        AsyncFunction("setShuffleMode") Coroutine { enabled: Boolean ->
            withPlayer { it.shuffleModeEnabled = enabled }
        }

        AsyncFunction("getState") Coroutine { ->
            withPlayer { p ->
                mapOf(
                    "isPlaying" to p.isPlaying,
                    "playbackState" to p.playbackState,
                    "index" to p.currentMediaItemIndex,
                    "repeatMode" to p.repeatMode,
                    "shuffle" to p.shuffleModeEnabled,
                    "queue" to List(p.mediaItemCount) { itemToMap(p.getMediaItemAt(it)) },
                ) + positionMap(p)
            }
        }
    }

    companion object {
        private const val POSITION_INTERVAL_MS = 250L
    }
}
