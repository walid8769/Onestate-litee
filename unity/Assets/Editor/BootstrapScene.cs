using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using System.IO;

[InitializeOnLoad]
public static class BootstrapScene
{
    private const string ScenePath = "Assets/Scenes/OneStatePrototype.unity";

    static BootstrapScene()
    {
        EditorApplication.delayCall += EnsureScene;
    }

    private static void EnsureScene()
    {
        if (EditorApplication.isCompiling || EditorApplication.isUpdating)
        {
            EditorApplication.delayCall += EnsureScene;
            return;
        }

        if (File.Exists(ScenePath))
            return;

        Directory.CreateDirectory("Assets/Scenes");
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

        EditorSceneManager.SaveScene(scene, ScenePath);
        AssetDatabase.Refresh();
        Debug.Log("OneState Unity prototype scene generated for build validation.");
    }
}
