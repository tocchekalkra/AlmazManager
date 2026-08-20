pluginManagement {
    repositories {
        System.getenv("ALMAZ_MAVEN_REPO")?.let { localRepository ->
            maven { url = uri(localRepository) }
        }
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        System.getenv("ALMAZ_MAVEN_REPO")?.let { localRepository ->
            maven { url = uri(localRepository) }
        }
        google()
        mavenCentral()
    }
}

rootProject.name = "AlmazManager.Android"
include(":app")
