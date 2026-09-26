import { supabase } from "../services/supabaseClient";

export const sendEmailResend = async (to, subject, html) => {
  console.log("📨 Iniciando envío de correo vía Edge Function a:", to);
  
  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: { to, subject, html },
    });

    if (error) {
      console.error("❌ Error ejecutando la Edge Function:", error);
      return false;
    }
    
    console.log("✅ ¡Correo enviado exitosamente vía Edge Function!");
    return true;
  } catch (error) {
    console.error("❌ Excepción llamando a la Edge Function:", error);
    return false;
  }
};

export const notificarCambioEstado = async (pedido, nuevoEstado) => {
  console.log("🔍 Intentando notificar cambio de estado para pedido:", pedido.numero, "a estado:", nuevoEstado);
  
  let emailParaEnviar = pedido.email;
  console.log("📩 Email que viene en el pedido (antes de buscar):", emailParaEnviar);

  // Si el pedido no trae el email, lo buscamos en la tabla clientes usando el teléfono
  if (!emailParaEnviar && pedido.telefono) {
    const cleanPhone = String(pedido.telefono).replace(/\D/g, "");
    console.log("📱 Buscando email en BD para el teléfono:", cleanPhone);
    try {
      const { data } = await supabase
        .from("clientes")
        .select("email")
        .eq("telefono", cleanPhone)
        .maybeSingle();
        
      console.log("📂 Resultado de BD:", data);
      
      if (data && data.email) {
        emailParaEnviar = data.email;
      }
    } catch (err) {
      console.warn("⚠️ No se pudo obtener el email del cliente:", err.message);
    }
  }

  console.log("📧 Email final a utilizar:", emailParaEnviar);

  if (!emailParaEnviar) {
    console.warn("⛔ No hay email disponible para el cliente, notificación omitida.");
    return;
  }

  let subject = "";
  let mensaje = "";
  const nombre = pedido.nombre || "Cliente";

  switch (nuevoEstado) {
    case "preparacion":
      subject = `👨‍🍳 ¡Tu pedido #${pedido.numero} se está preparando! - Paves Medellín`;
      mensaje = `
        <div style="font-family: sans-serif; color: #111; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #d92b38; padding: 20px; text-align: center;">
            <h2 style="color: white; margin: 0;">¡Manos a la obra!</h2>
          </div>
          <div style="padding: 30px; background-color: #fdfbf7;">
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>Hemos recibido y aceptado tu pedido <strong>#${pedido.numero}</strong>. En este momento nuestro equipo de repostería está preparando todo con mucho amor.</p>
            <p>Te avisaremos en cuanto esté listo para ser despachado.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
            <p style="font-size: 12px; color: #666; text-align: center;">Paves Medellín - Postres con amor</p>
          </div>
        </div>
      `;
      break;
    case "camino":
      subject = `🛵 ¡Tu pedido #${pedido.numero} va en camino! - Paves Medellín`;
      mensaje = `
        <div style="font-family: sans-serif; color: #111; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #ffcc00; padding: 20px; text-align: center;">
            <h2 style="color: #111; margin: 0;">¡Tu pedido va en camino!</h2>
          </div>
          <div style="padding: 30px; background-color: #fdfbf7;">
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>Tu pedido <strong>#${pedido.numero}</strong> ya salió de nuestra tienda y va en camino hacia la dirección de entrega.</p>
            <p>¡Por favor, mantente muy pendiente para recibir tus postres!</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
            <p style="font-size: 12px; color: #666; text-align: center;">Paves Medellín - Postres con amor</p>
          </div>
        </div>
      `;
      break;
    case "entregado":
      subject = `✅ Pedido #${pedido.numero} Entregado. ¡Que lo disfrutes!`;
      mensaje = `
        <div style="font-family: sans-serif; color: #111; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #4caf50; padding: 20px; text-align: center;">
            <h2 style="color: white; margin: 0;">¡Entregado!</h2>
          </div>
          <div style="padding: 30px; background-color: #fdfbf7;">
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>Tu pedido <strong>#${pedido.numero}</strong> ha sido entregado.</p>
            <p>Esperamos que disfrutes muchísimo tus Paves. Si te gustaron, ¡no olvides recomendarnos!</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
            <p style="font-size: 12px; color: #666; text-align: center;">Paves Medellín - Postres con amor</p>
          </div>
        </div>
      `;
      break;
    default:
      return;
  }

  await sendEmailResend(emailParaEnviar, subject, mensaje);
};

export const generarMensajeWhatsApp = (pedido, estado) => {
  const nombre = pedido.nombre || "Cliente";
  let texto = "";

  if (estado === "camino") {
    texto = `Hola ${nombre}! 🛵 Tu pedido #${pedido.numero} de Paves Medellín ya va en camino hacia tu dirección. ¡Estar muy pendiente!`;
  } else if (estado === "preparacion") {
    texto = `Hola ${nombre}! 👨‍🍳 Hemos comenzado a preparar tu pedido #${pedido.numero}. Te avisaremos cuando salga en camino.`;
  } else if (estado === "entregado") {
    texto = `Hola ${nombre}! ✅ Tu pedido #${pedido.numero} ha sido entregado. ¡Esperamos que lo disfrutes muchísimo!`;
  } else {
    texto = `Hola ${nombre}, te escribimos de Paves Medellín respecto a tu pedido #${pedido.numero}.`;
  }

  let phone = pedido.telefono || "";
  phone = phone.replace(/\D/g, "");
  if (phone && phone.length === 10 && phone.startsWith("3")) {
    phone = "57" + phone;
  }

  return {
    url: `https://wa.me/${phone}?text=${encodeURIComponent(texto)}`,
    hasPhone: phone.length >= 10
  };
};
