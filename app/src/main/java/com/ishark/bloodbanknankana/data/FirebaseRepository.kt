package com.ishark.bloodbanknankana.data
import com.google.firebase.Timestamp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import java.security.MessageDigest
import java.time.LocalDate
import java.time.Period
import java.util.Date

class FirebaseRepository {
 private val auth=FirebaseAuth.getInstance(); private val db=FirebaseFirestore.getInstance()
 fun uid()=auth.currentUser?.uid
 fun hashCnic(cnic:String)=MessageDigest.getInstance("SHA-256").digest(cnic.filter(Char::isDigit).toByteArray()).joinToString(""){"%02x".format(it)}
 fun age(dob:String)=runCatching { Period.between(LocalDate.parse(dob),LocalDate.now()).years }.getOrDefault(0)
 fun saveProfile(name:String, cnic:String, dob:String, group:String, tehsil:String, callback:(Exception?)->Unit) { val id=uid()?:return callback(IllegalStateException()); db.collection("users").document(id).set(mapOf("fullName" to name.trim(),"cnicHash" to hashCnic(cnic),"dateOfBirth" to dob,"bloodGroup" to group,"tehsil" to tehsil,"phone" to (auth.currentUser?.phoneNumber ?: ""),"verificationStatus" to "pending","updatedAt" to Timestamp.now()),SetOptions.merge()).addOnSuccessListener{callback(null)}.addOnFailureListener(callback) }
 fun setAvailability(value:Boolean, callback:(Exception?)->Unit) { val id=uid()?:return callback(IllegalStateException()); db.collection("donors").document(id).set(mapOf("available" to value,"updatedAt" to Timestamp.now()),SetOptions.merge()).addOnSuccessListener{callback(null)}.addOnFailureListener(callback) }
 fun createRequest(values:Map<String,Any>, callback:(Exception?)->Unit) { val id=uid()?:return callback(IllegalStateException()); db.collection("requests").add(values+mapOf("requesterId" to id,"status" to "active","createdAt" to Timestamp.now())).addOnSuccessListener{callback(null)}.addOnFailureListener(callback) }
 fun hospitals(callback:(List<Hospital>)->Unit) = db.collection("hospitals").whereEqualTo("published",true).addSnapshotListener { v,_ -> callback(v?.documents?.map{it.toObject(Hospital::class.java)?:Hospital()}?:emptyList()) }
 fun signOut()=auth.signOut()
}
