import { ref, uploadBytes } from "firebase/storage";
import { setDoc, doc, Timestamp, updateDoc, query, where } from "firebase/firestore";
import { db, storage } from "./firebaseConfig.js";
import { v4 as uuidv4 } from 'uuid';
import { collection, getDocs, getDoc } from "firebase/firestore";
import axios from 'axios';

export async function fichaCatalogacion(req,res){
  try{
      const esculturaId = req.query.esculturaId;
      const fichaCatalogacion = req.file;

      if (!fichaCatalogacion) return res.status(400).send("❌ Archivo faltante");
      if (fichaCatalogacion.mimetype !== 'application/pdf') {
        return res.status(400).send("❌ Solo se permiten archivos PDF");
      }
      const basePath = `esculturas/${esculturaId}/`;
      const catalogacionRef = fichaCatalogacion ? ref(storage, basePath + 'fichaCatalogacion.pdf') : null;

      if (catalogacionRef) await uploadBytes(catalogacionRef, fichaCatalogacion.buffer);

      const baseUrl = `http://localhost:9199/v0/b/modelo3d-local.appspot.com/o/`;
      const encodePath = path => `${baseUrl}${encodeURIComponent(path)}?alt=media`;
    
      await updateDoc(doc(db, 'esculturas', esculturaId), {
        ficha_catalogacion_url: catalogacionRef ? encodePath(basePath + 'fichaCatalogacion.pdf') : null
      });

      const esculturaRef = doc(db, 'esculturas', esculturaId);
      const esculturaSnap = await getDoc(esculturaRef);

      if (!esculturaSnap.exists()) {
        return res.status(404).send('❌ Escultura no encontrada');
      }

      const escultura = esculturaSnap.data();

      // Búsqueda de modelo con la id owo
      const modeloQuery = query(
        collection(db, 'modelos'),
        where('escultura_id', '==', esculturaId)
      );
      const modeloSnap = await getDocs(modeloQuery);
      
      let indicator = 0;
      if (!modeloSnap.empty) {
        indicator = 1;
      }

      res.render('datosEscultura', { escultura, indicator });
  } catch (error) {
    console.error("❌ Error al subir escultura:", error);
    res.status(500).send("Error al subir escultura");
  }
}

export async function fichaInventario(req,res){
  try{
      const esculturaId = req.query.esculturaId;
      const fichaInventario = req.file;

      if (!fichaInventario) return res.status(400).send("❌ Archivo faltante");
      if (fichaInventario.mimetype !== 'application/pdf') {
        return res.status(400).send("❌ Solo se permiten archivos PDF");
      }
      const basePath = `esculturas/${esculturaId}/`;
      const inventarioRef = fichaInventario ? ref(storage, basePath + 'fichaInventario.pdf') : null;

      if (inventarioRef) await uploadBytes(inventarioRef, fichaInventario.buffer);

      const baseUrl = `http://localhost:9199/v0/b/modelo3d-local.appspot.com/o/`;
      const encodePath = path => `${baseUrl}${encodeURIComponent(path)}?alt=media`;
    
      await updateDoc(doc(db, 'esculturas', esculturaId), {
        ficha_inventario_url: inventarioRef ? encodePath(basePath + 'fichaInventario.pdf') : null
      });
      
      const esculturaRef = doc(db, 'esculturas', esculturaId);
      const esculturaSnap = await getDoc(esculturaRef);

      if (!esculturaSnap.exists()) {
        return res.status(404).send('❌ Escultura no encontrada');
      }

      const escultura = esculturaSnap.data();

      // Búsqueda de modelo con la id owo
      const modeloQuery = query(
        collection(db, 'modelos'),
        where('escultura_id', '==', esculturaId)
      );
      const modeloSnap = await getDocs(modeloQuery);
      
      let indicator = 0;
      if (!modeloSnap.empty) {
        indicator = 1;
      }

      res.render('datosEscultura', { escultura, indicator });
  } catch (error) {
    console.error("❌ Error al subir escultura:", error);
    res.status(500).send("Error al subir escultura");
  }
}

export async function handleEsculturaUpload(req, res) {
  try {
    const { nombre, autor, descripcion } = req.body;

    const foto = req.files['foto']?.[0];
    const fichaIngreso = req.files['fichaIngreso']?.[0];
    const fichaInventario = req.files['fichaInventario']?.[0];
    const fichaCatalogacion = req.files['fichaCatalogacion']?.[0];

    if (!nombre || !autor || !descripcion || !foto || !fichaIngreso) {
      return res.status(400).send('❌ Faltan datos o archivos obligatorios');
    }

    const esculturaId = uuidv4();
    const basePath = `esculturas/${esculturaId}/`;

    // Referencias
    const fotoRef = ref(storage, basePath + 'foto.jpg');
    const ingresoRef = ref(storage, basePath + 'fichaIngreso.pdf');
    const inventarioRef = fichaInventario ? ref(storage, basePath + 'fichaInventario.pdf') : null;
    const catalogacionRef = fichaCatalogacion ? ref(storage, basePath + 'fichaCatalogacion.pdf') : null;

    // Subidas
    await uploadBytes(fotoRef, foto.buffer);
    await uploadBytes(ingresoRef, fichaIngreso.buffer);
    if (inventarioRef) await uploadBytes(inventarioRef, fichaInventario.buffer);
    if (catalogacionRef) await uploadBytes(catalogacionRef, fichaCatalogacion.buffer);

    // URLs
    const baseUrl = `http://localhost:9199/v0/b/modelo3d-local.appspot.com/o/`;
    const encodePath = path => `${baseUrl}${encodeURIComponent(path)}?alt=media`;

    const data = {
      id: esculturaId,
      nombre,
      autor,
      descripcion,
      fecha_creacion: Timestamp.now(),
      tipo: "escultura",
      imagen_url: encodePath(basePath + 'foto.jpg'),
      ficha_ingreso_url: encodePath(basePath + 'fichaIngreso.pdf'),
      ficha_inventario_url: inventarioRef ? encodePath(basePath + 'fichaInventario.pdf') : null,
      ficha_catalogacion_url: catalogacionRef ? encodePath(basePath + 'fichaCatalogacion.pdf') : null
    };

    await setDoc(doc(db, 'esculturas', esculturaId.toString()), data);

    res.redirect('/principalAdm'); // O cambia a una vista tipo /verescultura/:id si quieres detalle
  } catch (error) {
    console.error("❌ Error al subir escultura:", error);
    res.status(500).send("Error al subir escultura");
  }
}


export async function listarEsculturas(req, res) {
  try {
    const esculturasSnap = await getDocs(collection(db, 'esculturas'));
    const esculturas = [];

    esculturasSnap.forEach(doc => {
      esculturas.push(doc.data());
    });

    res.render('indexAdmin', {
      titulo: "Esculturas Registradas",
      esculturas
    });
  } catch (error) {
    console.error("❌ Error al listar esculturas:", error);
    res.status(500).send("Error al cargar esculturas");
  }
}

export async function verEsculturaPorId(req, res) {
  const { id } = req.params;

  try {
    const esculturaRef = doc(db, 'esculturas', id);
    const esculturaSnap = await getDoc(esculturaRef);

    if (!esculturaSnap.exists()) {
      return res.status(404).send('❌ Escultura no encontrada');
    }

    const escultura = esculturaSnap.data();
    
    // Búsqueda de modelo con la id owo
    const modeloQuery = query(
      collection(db, 'modelos'),
      where('escultura_id', '==', id)
    );
    const modeloSnap = await getDocs(modeloQuery);
    
    let indicator = 0;
    if (!modeloSnap.empty) {
      indicator = 1;
    }

    res.render('datosEscultura', { escultura, indicator });
  } catch (error) {
    console.error("❌ Error al obtener escultura:", error);
    res.status(500).send("Error interno del servidor");
  }
}

export async function descargarArchivo(req, res) {
  const { url, nombre } = req.query;

  try {
    const response = await axios.get(url, { responseType: 'stream' });

    res.setHeader('Content-Disposition', `attachment; filename="${nombre || 'archivo.pdf'}"`);
    res.setHeader('Content-Type', 'application/pdf');

    response.data.pipe(res);
  } catch (error) {
    console.error("Error al descargar archivo:", error);
    res.status(500).send("Error al descargar archivo");
  }
}