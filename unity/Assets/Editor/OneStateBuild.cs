using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

public static class OneStateBuild
{
    private const string SceneAssetPath = "Assets/Scenes/OneStatePrototype.unity";

    public static void BuildUnsignedIOS()
    {
        EnsurePrototypeScene();
        PlayerSettings.applicationIdentifier = "com.onestate.litee";
        PlayerSettings.iOS.targetDevice = iOSTargetDevice.iPhoneOnly;
        PlayerSettings.iOS.targetOSVersionString = "13.0";
        PlayerSettings.SetArchitecture(BuildTargetGroup.iOS, (int) UnityEditor.iOS.Xcode.iOSArchitecture.ARM64);
        PlayerSettings.SetScriptingBackend(BuildTargetGroup.iOS, ScriptingImplementation.IL2CPP);
        EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.iOS, BuildTarget.iOS);

        var projectRoot = Directory.GetParent(Application.dataPath).FullName;
        var outputPath = Path.GetFullPath(Path.Combine(projectRoot, "..", "build", "ios-xcode"));
        Directory.CreateDirectory(outputPath);

        var options = new BuildPlayerOptions
        {
            scenes = new[] { SceneAssetPath },
            locationPathName = outputPath,
            target = BuildTarget.iOS,
            options = BuildOptions.None
        };

        var report = BuildPipeline.BuildPlayer(options);
        Debug.Log("iOS Xcode export result: " + report.summary.result +
                  "; errors=" + report.summary.totalErrors +
                  "; output=" + outputPath);
        if (report.summary.result != BuildResult.Succeeded)
            throw new Exception("Unity iOS Xcode export failed: " + report.summary.result);
    }

    private static void EnsurePrototypeScene()
    {
        Directory.CreateDirectory("Assets/Scenes");
        if (!File.Exists(SceneAssetPath))
        {
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            var cameraObject = new GameObject("Main Camera");
            cameraObject.tag = "MainCamera";
            cameraObject.transform.position = new Vector3(0f, 4f, -8f);
            cameraObject.transform.rotation = Quaternion.Euler(20f, 0f, 0f);
            var camera = cameraObject.AddComponent<Camera>();
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = new Color(0.12f, 0.16f, 0.22f);

            var lightObject = new GameObject("Directional Light");
            lightObject.transform.rotation = Quaternion.Euler(50f, -30f, 0f);
            var light = lightObject.AddComponent<Light>();
            light.type = LightType.Directional;
            light.intensity = 1.2f;

            var ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
            ground.name = "Prototype Ground";
            ground.transform.localScale = new Vector3(5f, 1f, 5f);

            var marker = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            marker.name = "Prototype Player Marker";
            marker.transform.position = new Vector3(0f, 1f, 0f);

            EditorSceneManager.SaveScene(scene, SceneAssetPath);
            AssetDatabase.Refresh();
        }

        EditorBuildSettings.scenes = new[]
        {
            new EditorBuildSettingsScene(SceneAssetPath, true)
        };
    }
}
