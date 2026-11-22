package com.aruteko.sirenplayer.audio

import android.net.Uri
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DataSpec
import androidx.media3.datasource.ResolvingDataSource
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.ConcurrentHashMap

/**
 * 曲の URI `siren://song/{cid}` を，再生の直前に公開 API から得た音源の URL へ置き換える．
 * 音源の URL は署名つきで期限があるため，キューには保存せず，その都度引く．
 */
@UnstableApi
class SirenSourceResolver(private val client: OkHttpClient) : ResolvingDataSource.Resolver {

    private data class Entry(val url: String, val fetchedAt: Long)

    private val cache = ConcurrentHashMap<String, Entry>()

    override fun resolveDataSpec(dataSpec: DataSpec): DataSpec {
        val uri = dataSpec.uri
        if (uri.scheme != SCHEME) return dataSpec
        val cid = uri.lastPathSegment ?: throw IOException("Missing song id: $uri")
        return dataSpec.withUri(Uri.parse(resolve(cid)))
    }

    private fun resolve(cid: String): String {
        val now = System.currentTimeMillis()
        cache[cid]?.let { if (now - it.fetchedAt < CACHE_TTL_MS) return it.url }

        val request = Request.Builder().url("$API_BASE/song/$cid").build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) throw IOException("Siren API error: ${response.code}")
            val body = response.body?.string() ?: throw IOException("Empty response")
            val url = JSONObject(body).optJSONObject("data")?.optString("sourceUrl").orEmpty()
            if (url.isEmpty()) throw IOException("No source URL for song $cid")
            cache[cid] = Entry(url, now)
            return url
        }
    }

    companion object {
        const val SCHEME = "siren"
        private const val API_BASE = "https://monster-siren.hypergryph.com/api"
        private const val CACHE_TTL_MS = 2 * 60 * 1000L
    }
}
