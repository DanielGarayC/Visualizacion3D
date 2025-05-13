const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();

//Middleware para archivos estáticos
app.use(express.static(path.join(__dirname,'../frontend')));

const uploadFolder = process.env.UPLOAD_FOLDER || path.join(__dirname, '../uploads');
console.log(`📂 Ruta configurada para la subida: ${uploadFolder}`);

// Configuración de Multer para guardar el archivo en la carpeta especificada
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder, { recursive: true });
        cb(null, uploadFolder);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Guardar el archivo con su nombre original
    }
});
const upload = multer({
    storage});

//Middleware para vistas
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'../frontend/views'))
//Rutas
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
  ]), (req, res) => {
    if (!req.files || !req.files['fbxfile'] || !req.files['texturefile']) {
      return res.status(400).send('❌ Faltan archivos');
    }
  
    const fbxFile = req.files['fbxfile'][0];
    console.log("fbxFile:",{fbxFile})
    const textureFile = req.files['texturefile'][0];
  console.log("textureFile:",{textureFile})
    const fbxName = fbxFile.filename;
      console.log("fbxName:",encodeURIComponent(fbxName))

    const textureName = textureFile.filename;
    console.log("textureName:",encodeURIComponent(textureName))

    // Redireccionar a la vista del visor con los nombres como parámetros
    res.redirect(`/vermodelo/${encodeURIComponent(fbxName)}/${encodeURIComponent(textureName)}`);
  });
  //Predefinida la escultura de padre
  app.get('/vermodelo/predefinido', (req, res) => {
    const fbx = 'padre-v2-fbx.fbx';
    const texture = 'padre-v2-fbx.jpg';
  
    res.redirect(`/vermodelo/${encodeURIComponent(fbx)}/${encodeURIComponent(texture)}`);
  });
  //Predefinida la escultura de void
  app.get('/vermodelo/predefinido2', (req, res) => {
    const fbx = 'void-fbx.fbx';
    const texture = 'void-fbx.jpg';
  
    res.redirect(`/vermodelo/${encodeURIComponent(fbx)}/${encodeURIComponent(texture)}`);
  });

  // Nueva ruta: visor que carga el modelo y la textura
  app.get('/vermodelo/:fbx/:texture', (req, res) => {
    const { fbx, texture } = req.params;
    if(fbx=='void-fbx.fbx'){
      nameSculture="Escultura: Void";
    }else if(fbx=='padre-v2-fbx.fbx'){
      nameSculture="Escultura: El Padre";
    }else{
      nameSculture="Escultura subida";
    }
    const fbxUrl = `/uploads/${fbx}`;
    const textureUrl = `/uploads/${texture}`;
  
    res.render('/seccionamiento3dV3', { fbxUrl, textureUrl, nameSculture});

  });
module.exports = app;