const mongoose = require("mongoose");

module.exports = async () => {
  try {
    // Esto nos dirá qué URL está leyendo el servidor realmente
    console.log("Intentando conectar a:", process.env.MONGO_URI); 
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB conectado");
  } catch (error) {
    console.error("❌ Error conectando Mongo:", error.message);
  }
};