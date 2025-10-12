package com.company.dvizhtrue

import android.util.Log
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import com.google.firebase.firestore.FieldValue

object TestFirebase {
    fun testConnection() {
        Log.d("TestFirebase", "=== TESTING FIREBASE CONNECTION ===")
        
        try {
            val db = Firebase.firestore("dvizheon")
            Log.d("TestFirebase", "Firestore instance created: ${db.app.name}")
            Log.d("TestFirebase", "Project ID: ${db.app.options.projectId}")
            
            // Попробуем создать простой документ
            val testDoc = db.collection("test").document("connection-test")
            val testData = hashMapOf(
                "message" to "Hello Firebase!",
                "timestamp" to FieldValue.serverTimestamp()
            )
            
            testDoc.set(testData)
                .addOnSuccessListener {
                    Log.d("TestFirebase", "✅ SUCCESS: Test document created!")
                    Log.d("TestFirebase", "✅ Document ID: ${testDoc.id}")
                    Log.d("TestFirebase", "✅ Document path: ${testDoc.path}")
                }
                .addOnFailureListener { e ->
                    Log.e("TestFirebase", "❌ FAILED: Could not create test document", e)
                    Log.e("TestFirebase", "❌ Error details: ${e.message}")
                    Log.e("TestFirebase", "❌ Error cause: ${e.cause}")
                }
                
        } catch (e: Exception) {
            Log.e("TestFirebase", "❌ EXCEPTION: Firebase connection failed", e)
        }
    }
}
