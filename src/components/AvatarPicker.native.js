import React, { useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function AvatarPicker({ avatarUrl, onSelect, disabled }) {
  const [choosing, setChoosing] = useState(false);
  async function choosePhoto() {
    if (disabled || choosing) return;
    setChoosing(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.82
      });
      if (!result.canceled && result.assets?.[0]) onSelect(result.assets[0]);
    } finally {
      setChoosing(false);
    }
  }
  return (
    <View style={{alignItems:'center',marginBottom:20,gap:10}}>
      {avatarUrl
        ? <Image source={{uri:avatarUrl}} style={{width:92,height:92,borderRadius:28,borderWidth:3,borderColor:'#d9eee9'}} />
        : <View style={{width:92,height:92,borderRadius:28,backgroundColor:'#e5f4f1',alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:34,fontWeight:'800',color:'#087f72'}}>L</Text></View>}
      <TouchableOpacity disabled={disabled || choosing} onPress={choosePhoto} style={{backgroundColor:'#e5f4f1',paddingHorizontal:18,paddingVertical:10,borderRadius:12}}>
        <Text style={{color:'#087f72',fontWeight:'800'}}>{choosing ? 'جارٍ اختيار الصورة...' : 'تغيير الصورة'}</Text>
      </TouchableOpacity>
      <Text style={{color:'#74808c',fontSize:11}}>JPG أو PNG أو WEBP · حتى 3 ميجابايت</Text>
    </View>
  );
}
