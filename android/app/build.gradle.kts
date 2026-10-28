plugins {
    id("com.android.application")
}

android {
    namespace = "com.tamanegininja.cursedchronicles"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.tamanegininja.cursedchronicles"
        minSdk = 24
        targetSdk = 35
        versionCode = 5
        versionName = "1.3.1"
    }

    // Android only installs a new APK as an update when it is signed with the same key as the
    // installed one. CI used to sign with a throwaway debug key generated per run, so every
    // release looked like a different app. When CC_KEYSTORE points at the project's permanent
    // key (CI decodes it from a repository secret), every build is signed with it; without it
    // builds still work but fall back to the local debug key.
    val keystore = System.getenv("CC_KEYSTORE")?.let { file(it) }?.takeIf { it.exists() }
    signingConfigs {
        if (keystore != null) {
            create("cursed") {
                storeFile = keystore
                storePassword = System.getenv("CC_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("CC_KEY_ALIAS") ?: "cursedchronicles"
                keyPassword = System.getenv("CC_KEY_PASSWORD") ?: System.getenv("CC_KEYSTORE_PASSWORD")
            }
        }
    }
    val signing = signingConfigs.findByName("cursed") ?: signingConfigs.getByName("debug")

    buildTypes {
        debug {
            signingConfig = signing
        }
        release {
            isMinifyEnabled = false
            signingConfig = signing
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    androidResources {
        // keep the bundled web game uncompressed for fast WebView loading
        noCompress += listOf("js", "css", "html")
    }
}
