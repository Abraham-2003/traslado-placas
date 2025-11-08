const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.notificarTrasladoNuevo = functions.firestore
  .document('traslados/{id}')
  .onCreate(async (snap, context) => {
    const data = snap.data();

    try {
      const adminQuery = await admin.firestore()
        .collection('users')
        .where('role', '==', 'admin')
        .get();

      if (adminQuery.empty) {
        console.warn('⚠️ No se encontraron administradores');
        return;
      }

      const tokens = adminQuery.docs
        .map(doc => doc.data()?.fcmToken)
        .filter(token => !!token);

      if (tokens.length === 0) {
        console.warn('⚠️ Ningún administrador tiene token FCM registrado');
        return;
      }

      const mensajes = tokens.map(token => ({
        notification: {
          title: 'Nuevo traslado registrado',
          body: `Placa: ${data.placa}`,
        },
        token,
      }));

      const resultados = await Promise.allSettled(
        mensajes.map(m => admin.messaging().send(m))
      );

      resultados.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          console.log(`✅ Notificación enviada a admin ${i + 1}`);
        } else {
          console.error(`❌ Error al enviar a admin ${i + 1}:`, r.reason);
        }
      });
    } catch (error) {
      console.error('❌ Error general en notificarTrasladoNuevo:', error);
    }
  });
