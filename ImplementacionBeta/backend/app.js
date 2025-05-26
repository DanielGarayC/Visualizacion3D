import express from 'express';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { handleFbxUpload } from './modeloController.js';
import { db } from './firebaseConfig.js'; // Ajusta la ruta si es necesario
import { doc, getDoc } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express(); 
//Middleware para archivos estáticos
app.use(express.static(path.join(__dirname,'../frontend')));


// Configuración de Multer para guardar el archivo en la carpeta especificada
const storage = multer.memoryStorage();
const upload = multer({ storage });

//Middleware para vistas
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'../frontend/views'))
//Rutas
//Login
app.get('/login', (req,res)=> 
  res.render('login')
)
//Principal sin permisos :c)
app.get('/principal', (req,res) => 
    res.render('index',{titulo: "Esculturas Registradas"})
);
//Principal con botón con permisos
app.get('/principalAdm', (req,res) => 
    res.render('indexAdmin',{titulo: "Esculturas Registradas"})
);
//Ruta al dar al botón Agregar Modelo
app.get('/newModel', (req, res) =>
    res.render('subirfbx')
);

// Exponer la carpeta donde se guardan los archivos FBX y texturas
app.use('/uploads', express.static('C:/Users/Daniel/Documents')); // ⚠️ Asegúrate de que los archivos realmente se están guardando ahí

// Endpoint para subir FBX + textura y redirigir a visor

app.post('/uploadfbx', upload.fields([
  { name: 'fbxfile', maxCount: 1 },
  { name: 'texturefile', maxCount: 1 }
  ]), handleFbxUpload);

  // Nueva ruta: visor que carga el modelo y la textura
  app.get('/vermodelo/:id', async (req, res) => {
  const id = req.params.id;

  try {
    // 🔍 buscar el documento por ID
    const docRef = doc(db, 'modelos', id);
    const modeloSnap = await getDoc(docRef);

    if (!modeloSnap.exists()) {
      return res.status(404).send('Modelo no encontrado');
    }

    const modelo = modeloSnap.data();

    res.render('seccionamiento3dV3', {
      fbxUrl: modelo.archivo_modelo_url,
      textureUrl: modelo.texturas[0],
      nameSculture: modelo.nombre || 'Modelo 3D',
      indicator : 'padre'
    });
  } catch (error) {
    console.error("Error al buscar modelo", error);
    res.status(500).send("Error interno");
  }
});

export default app;