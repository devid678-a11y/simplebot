package com.company.dvizhtrue.data

import com.google.android.gms.tasks.Task
import com.google.firebase.firestore.DocumentReference
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions

object UserRepository {
    private val db = FirebaseFirestore.getInstance("dvizheon")
    private val usersCollection = db.collection("users")

    fun createUser(uid: String, userData: Map<String, Any>): Task<DocumentReference> {
        return usersCollection.document(uid).set(userData, SetOptions.merge())
            .continueWith { usersCollection.document(uid) }
    }

    fun getUser(uid: String): Task<com.google.firebase.firestore.DocumentSnapshot> {
        return usersCollection.document(uid).get()
    }

    fun updateUser(uid: String, updates: Map<String, Any>): Task<Void> {
        return usersCollection.document(uid).update(updates)
    }

    fun deleteUser(uid: String): Task<Void> {
        return usersCollection.document(uid).delete()
    }
}
