package com.ishark.bloodbanknankana.data
import com.google.firebase.Timestamp

data class UserProfile(val fullName:String="", val bloodGroup:String="", val tehsil:String="", val verified:Boolean=false, val available:Boolean=false, val nextEligibleAt:Timestamp?=null)
data class Hospital(val name:String="", val address:String="", val phone:String="", val stockStatus:String="")
