package com.tamanegininja.cursedchronicles;

import android.content.Context;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import java.util.Locale;

/**
 * Small native helpers the game can call as window.CCAndroid: the phone's text-to-speech engine
 * for spoken dialogue. Speech ends are reported back with window.__ttsDone(id).
 */
final class GameBridge {
    private final WebView web;
    private TextToSpeech tts;
    private volatile boolean ready = false;

    GameBridge(Context ctx, WebView web) {
        this.web = web;
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

    @JavascriptInterface
    public void ttsSpeak(String text, float pitch, float rate, String id) {
        if (!ready || tts == null || text == null) return;
        tts.setPitch(Math.max(0.3f, Math.min(2.0f, pitch)));
        tts.setSpeechRate(Math.max(0.5f, Math.min(2.0f, rate)));
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, new Bundle(), id);
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
