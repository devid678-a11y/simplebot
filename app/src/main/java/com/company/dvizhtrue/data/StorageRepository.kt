package com.company.dvizhtrue.data

import android.content.Context
import android.net.Uri
import com.google.android.gms.tasks.Task
import com.google.firebase.storage.FirebaseStorage
import com.google.firebase.storage.StorageReference
import com.google.firebase.storage.UploadTask
import java.util.UUID

object StorageRepository {
    private val storage = FirebaseStorage.getInstance()
    private val storageRef = storage.reference

    // Простой метод для загрузки изображения (используется в HomeViewModel)
    fun uploadImage(
        context: Context,
        uri: Uri,
        eventId: String
    ): String? {
        try {
            val filename = "img_${System.currentTimeMillis()}.jpg"
            val imageRef = storageRef.child("events/$eventId/$filename")
            
            val uploadTask = imageRef.putFile(uri)
            
            // Ждем завершения загрузки
            val result = com.google.android.gms.tasks.Tasks.await(uploadTask)
            
            if (result.task.isSuccessful) {
                val downloadUrl = com.google.android.gms.tasks.Tasks.await(imageRef.downloadUrl)
                return downloadUrl.toString()
            } else {
                throw result.task.exception ?: Exception("Upload failed")
            }
        } catch (e: Exception) {
            android.util.Log.e("StorageRepository", "Error uploading image: ${e.message}", e)
            return null
        }
    }

    // Метод для загрузки изображения с прогрессом (используется в HomeViewModel)
    fun uploadEventImageWithProgress(
        context: Context,
        eventId: String,
        uri: Uri,
        filename: String,
        onProgress: (Float) -> Unit
    ): Task<Uri> {
        val imageRef = storageRef.child("events/$eventId/$filename")
        
        val uploadTask = imageRef.putFile(uri)
        
        uploadTask.addOnProgressListener { taskSnapshot ->
            val progress = taskSnapshot.bytesTransferred.toFloat() / taskSnapshot.totalByteCount
            onProgress(progress)
        }
        
        return uploadTask.continueWithTask { task ->
            if (task.isSuccessful) {
                imageRef.downloadUrl
            } else {
                throw task.exception ?: Exception("Upload failed")
            }
        }
    }

    // Метод для загрузки байтов с прогрессом
    fun uploadEventImageBytesWithProgress(
        context: Context,
        eventId: String,
        filename: String,
        data: ByteArray,
        onProgress: (Float) -> Unit
    ): Task<Uri> {
        val imageRef = storageRef.child("events/$eventId/$filename")
        
        val uploadTask = imageRef.putBytes(data)
        
        uploadTask.addOnProgressListener { taskSnapshot ->
            val progress = taskSnapshot.bytesTransferred.toFloat() / taskSnapshot.totalByteCount
            onProgress(progress)
        }
        
        return uploadTask.continueWithTask { task ->
            if (task.isSuccessful) {
                imageRef.downloadUrl
            } else {
                throw task.exception ?: Exception("Upload failed")
            }
        }
    }

    fun deleteImage(imageUrl: String): Task<Void> {
        val imageRef = storage.getReferenceFromUrl(imageUrl)
        return imageRef.delete()
    }
}
