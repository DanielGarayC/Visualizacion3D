// MODIFICAR USUARIO LOCAL AL MOMENTO DE ESCLAR A NUBE
import { ref, uploadBytes } from "firebase/storage";
import { setDoc, doc, Timestamp } from "firebase/firestore";
import { db, storage } from "./firebaseConfig.js";

export async function handleFbxUpload(req, res) {
  try {
    const fbxFile = req.files['fbxfile']?.[0];
    const textureFile = req.files['texturefile']?.[0];

    if (!fbxFile || !textureFile) {
      return res.status(400).send('❌ Faltan archivos');
    }

    const modeloId = Date.now(); // Puedes usar UUID si prefieres
    const fbxRef = ref(storage, `modelos/${modeloId}/modelo.fbx`);
    const texRef = ref(storage, `modelos/${modeloId}/textura.jpg`);

    await uploadBytes(fbxRef, fbxFile.buffer);
    await uploadBytes(texRef, textureFile.buffer);

    const encodedPathFbx = encodeURIComponent(`modelos/${modeloId}/modelo.fbx`);
    const fbxUrl = `http://localhost:9199/v0/b/modelo3d-local.appspot.com/o/${encodedPathFbx}?alt=media`;

    const encodedPathTex = encodeURIComponent(`modelos/${modeloId}/textura.jpg`);
    const textureUrl = `http://localhost:9199/v0/b/modelo3d-local.appspot.com/o/${encodedPathTex}?alt=media`;


    await setDoc(doc(db, 'modelos', modeloId.toString()), {
      id: modeloId,  
      nombre: `modelo_${modeloId}`,
      archivo_modelo_url: fbxUrl,
      texturas: [textureUrl],
      //usuario_id: "usuario_local",
      fecha_creacion: Timestamp.now(),
      tipo: "escultura"
    });
    //Modificar a donde se redirecciona
    res.redirect(`/vermodelo/${modeloId}`);
  } catch (err) {
    console.error("❌ Error al subir archivo:", err);
    res.status(500).send("Error al subir archivos");
  }
}
