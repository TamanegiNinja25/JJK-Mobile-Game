package com.tamanegininja.cursedchronicles;

import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

/**
 * Small native helpers the game can call as window.CCAndroid: the phone's text-to-speech engine
 * for spoken dialogue (speech ends are reported back with window.__ttsDone(id)), and opening the
 * game's release page in the phone's browser when an update is out.
 */
final class GameBridge {
    /** the only pages the game may open outside itself: its own GitHub repository */
    static final String REPO_PAGES = "https://github.com/TamanegiNinja25/JJK-Mobile-Game";

    private final WebView web;
    private final Context app;
    private TextToSpeech tts;
    private volatile boolean ready = false;

    GameBridge(Context ctx, WebView web) {
        this.web = web;
        this.app = ctx.getApplicationContext();
        tts = new TextToSpeech(ctx.getApplicationContext(), status -> {
            if (status != TextToSpeech.SUCCESS || tts == null) return;
            int lang = tts.setLanguage(Locale.US);
            if (lang == TextToSpeech.LANG_MISSING_DATA || lang == TextToSpeech.LANG_NOT_SUPPORTED) tts.setLanguage(Locale.getDefault());
            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override public void onStart(String id) { }
                @Override public void onDone(String id) { report(id); }
                @Override public void onError(String id) { report(id); }
                @Override public void onStop(String id, boolean interrupted) { report(id); }
            });
            ready = true;
        });
    }

    private void report(final String id) {
        final String safe = id == null ? "" : id.replaceAll("[^A-Za-z0-9_-]", "");
        web.post(() -> web.evaluateJavascript("window.__ttsDone&&window.__ttsDone('" + safe + "')", null));
    }

    @JavascriptInterface
    public boolean ttsReady() {
        return ready;
    }

    /** The language dialogue is read in: "ja-JP" when the game is in Japanese, otherwise US English. */
    @JavascriptInterface
    public void ttsLang(String tag) {
        if (!ready || tts == null) return;
        Locale want = tag != null && tag.startsWith("ja") ? Locale.JAPAN : Locale.US;
        int r = tts.setLanguage(want);
        if (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) tts.setLanguage(Locale.getDefault());
    }

    @JavascriptInterface
    public void ttsSpeak(String text, float pitch, float rate, String id) {
        if (!ready || tts == null || text == null) return;
        tts.setPitch(Math.max(0.3f, Math.min(2.0f, pitch)));
        tts.setSpeechRate(Math.max(0.5f, Math.min(2.0f, rate)));
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, new Bundle(), id);
    }

    /** Opens a page of the game's repository (the release page) in the browser. Anything else is refused. */
    @JavascriptInterface
    public boolean openUrl(String url) {
        if (!isRepoPage(url)) return false;
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            app.startActivity(i);
            return true;
        } catch (ActivityNotFoundException | SecurityException e) {
            return false;
        }
    }

    /**
     * Saves a backup file the game made. On Android 10+ it goes straight into Downloads (no permission needed);
     * older phones get the share sheet, so it can be kept in Drive, Files or a message. Returns "downloads",
     * "shared" or "" on failure. Only plain text named like the game's own backups is accepted.
     */
    @JavascriptInterface
    public String saveText(String name, String text) {
        if (name == null || text == null || !name.matches("cursed-chronicles-[A-Za-z0-9._-]{1,60}\\.json") || text.length() > 8_000_000) return "";
        if (Build.VERSION.SDK_INT >= 29) {
            try {
                ContentValues v = new ContentValues();
                v.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
                v.put(MediaStore.MediaColumns.MIME_TYPE, "application/json");
                Uri uri = app.getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                if (uri != null) {
                    try (OutputStream out = app.getContentResolver().openOutputStream(uri)) {
                        if (out != null) { out.write(text.getBytes(StandardCharsets.UTF_8)); return "downloads"; }
                    }
                }
            } catch (Exception e) { /* fall through to sharing */ }
        }
        try {
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType("text/plain");
            send.putExtra(Intent.EXTRA_SUBJECT, name);
            send.putExtra(Intent.EXTRA_TEXT, text);
            Intent chooser = Intent.createChooser(send, name);
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            app.startActivity(chooser);
            return "shared";
        } catch (ActivityNotFoundException | SecurityException e) {
            return "";
        }
    }

    static boolean isRepoPage(String url) {
        return url != null && (url.equals(REPO_PAGES) || url.startsWith(REPO_PAGES + "/")) && !url.contains("..");
    }

    @JavascriptInterface
    public void ttsStop() {
        if (ready && tts != null) tts.stop();
    }

    void shutdown() {
        ready = false;
        if (tts != null) {
            tts.stop();
            tts.shutdown();
            tts = null;
        }
    }
}
