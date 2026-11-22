import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { getCurrentCoordinates } from './src/location';
import RadiusSlider from './src/components/RadiusSlider';
import NearbyMap from './src/components/NearbyMap';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://uinorprelciuqgfzeblg.supabase.co';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_i-rHjp3ZJ9iQqI-ZI39lVA_4U-4ahBn';
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: Platform.OS === 'web' }
}) : null;

const palette = { ink:'#17212B', muted:'#74808C', brand:'#087F72', bg:'#F4F7F8', card:'#FFFFFF', line:'#E5EBED', soft:'#E5F4F1', danger:'#B42318' };

function showAlert(title, message) {
  if (Platform.OS === 'web' && typeof globalThis.alert === 'function') {
    globalThis.alert(`${title}\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [visible, setVisible] = useState(false);
  const [radius, setRadius] = useState(10);
  const [people, setPeople] = useState([]);
  const [myLocation, setMyLocation] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('nearby');
  const [chatId, setChatId] = useState(null);
  const [chatPartner, setChatPartner] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session) loadProfile(); }, [session]);

  async function readCurrentCoordinates() {
    try {
      return await getCurrentCoordinates({ platform: Platform.OS, locationApi: Location });
    } catch (error) {
      if (error?.code === 'LOCATION_PERMISSION_DENIED' || error?.code === 1) {
        showAlert('الموقع غير مسموح', 'اسمح للمتصفح أو التطبيق بالوصول إلى الموقع حتى تظهر للأشخاص القريبين.');
        return null;
      }
      showAlert('تعذر تحديد الموقع', error?.message || 'تأكد من تشغيل خدمة الموقع وحاول مرة أخرى.');
      return null;
    }
  }

  async function loadProfile() {
    if (!supabase || !session?.user) return;
    const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', session.user.id).maybeSingle();
    const { data: presence } = await supabase.from('location_presence').select('is_visible').eq('user_id', session.user.id).maybeSingle();
    setDisplayName(profile?.display_name || '');
    setVisible(!!presence?.is_visible);
  }

  async function authenticate(createAccount) {
    if (!supabase) return showAlert('إعداد مطلوب', 'يلزم إضافة مفتاح Supabase Publishable إلى إعدادات البناء.');
    if (!email.trim() || password.length < 6) return showAlert('راجع البيانات', 'اكتب البريد الإلكتروني وكلمة مرور من 6 أحرف على الأقل.');
    setBusy(true);
    const result = createAccount
      ? await supabase.auth.signUp({ email: email.trim(), password })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (result.error) return showAlert('تعذر تسجيل الدخول', result.error.message);
    if (createAccount && !result.data.session) showAlert('تحقق من بريدك', 'أرسلنا رسالة تأكيد إلى بريدك الإلكتروني.');
  }

  async function savePresence(nextVisible = visible) {
    if (!supabase || !session) return;
    if (!displayName.trim()) return showAlert('الاسم مطلوب', 'اكتب الاسم الذي سيظهر للآخرين.');
    setBusy(true);
    let lat = null, lon = null;
    if (nextVisible) {
      const coordinates = await readCurrentCoordinates();
      if (!coordinates) { setBusy(false); return; }
      lat = coordinates.latitude; lon = coordinates.longitude;
      setMyLocation(coordinates);
    }
    const { error: presenceError } = await supabase.rpc('set_my_presence', { lat, lon, visible: nextVisible });
    if (presenceError) { setBusy(false); return showAlert('تعذر حفظ حالة الظهور', presenceError.message); }
    const { error: profileError } = await supabase.from('profiles').upsert({ id: session.user.id, display_name: displayName.trim() }, { onConflict: 'id' });
    setBusy(false);
    if (profileError) return showAlert('تعذر حفظ الاسم', profileError.message);
    setVisible(nextVisible);
    if (nextVisible) findNearby(nextVisible);
    else { setPeople([]); setMyLocation(null); }
  }

  async function findNearby(visibility = visible) {
    if (!supabase || !session) return;
    setBusy(true);
    const coordinates = await readCurrentCoordinates();
    if (!coordinates) { setBusy(false); return; }
    setMyLocation(coordinates);
    const { error: presenceError } = await supabase.rpc('set_my_presence', { lat: coordinates.latitude, lon: coordinates.longitude, visible: visibility });
    if (presenceError) { setBusy(false); return showAlert('تعذر تحديث موقعك', presenceError.message); }
    const { data, error } = await supabase.rpc('nearby_people', { radius_m: radius * 1000 });
    setBusy(false);
    if (error) return showAlert('تعذر تحميل الأشخاص', error.message);
    setPeople(data || []);
  }

  async function openChat(person) {
    setBusy(true);
    const { data, error } = await supabase.rpc('open_conversation', { target_user_id: person.user_id });
    setBusy(false);
    if (error) return showAlert('تعذر فتح المحادثة', error.message);
    setChatPartner(person);
    setChatId(data);
    setTab('chat');
    await loadChatMessages(data);
  }

  async function loadChatMessages(conversationId) {
    if (!conversationId) return;
    const { data, error } = await supabase.from('messages').select('id,sender_id,body,created_at')
      .eq('conversation_id', conversationId).order('created_at', { ascending: true }).limit(200);
    if (error) return showAlert('تعذر تحميل الرسائل', error.message);
    setChatMessages(data || []);
  }

  async function sendMessage() {
    const body = draft.trim();
    if (!body || !chatId) return;
    setBusy(true);
    const { data, error } = await supabase.from('messages')
      .insert({ conversation_id: chatId, sender_id: session.user.id, body }).select('id,sender_id,body,created_at').single();
    setBusy(false);
    if (error) return showAlert('تعذر إرسال الرسالة', error.message);
    setChatMessages(current => [...current, data]);
    setDraft('');
  }

  async function signOut() { await supabase?.auth.signOut(); setPeople([]); setVisible(false); setChatId(null); setChatMessages([]); }

  if (loading) return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color={palette.brand} /></SafeAreaView>;
  if (!supabase) return <SafeAreaView style={styles.page}><View style={styles.header}><Text style={styles.logo}>LookChat</Text></View><View style={styles.panel}><Text style={styles.heading}>التطبيق يحتاج إعداد الاتصال</Text><Text style={styles.body}>تم تجهيز المشروع. يلزم ضبط متغيري Supabase في إعدادات GitHub Actions قبل تشغيل تسجيل الدخول والبيانات.</Text></View></SafeAreaView>;
  if (!session) return <SafeAreaView style={styles.page}><StatusBar barStyle="dark-content" /><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.authWrap}><View style={styles.brandMark}><Text style={styles.brandMarkText}>L</Text></View><Text style={styles.logo}>LookChat</Text><Text style={styles.subtitle}>قريبون منك، عندما تختار الظهور</Text><View style={styles.panel}><Text style={styles.heading}>أهلاً بيك</Text><Text style={styles.label}>البريد الإلكتروني</Text><TextInput value={email} onChangeText={setEmail} placeholder="name@example.com" autoCapitalize="none" keyboardType="email-address" style={styles.input} /><Text style={styles.label}>كلمة المرور</Text><TextInput value={password} onChangeText={setPassword} placeholder="6 أحرف على الأقل" secureTextEntry style={styles.input} /><TouchableOpacity disabled={busy} style={styles.primary} onPress={() => authenticate(false)}><Text style={styles.primaryText}>{busy ? 'جارٍ التنفيذ...' : 'تسجيل الدخول'}</Text></TouchableOpacity><TouchableOpacity disabled={busy} style={styles.secondary} onPress={() => authenticate(true)}><Text style={styles.secondaryText}>إنشاء حساب جديد</Text></TouchableOpacity></View></KeyboardAvoidingView></SafeAreaView>;

  return <SafeAreaView style={styles.page}><StatusBar barStyle="dark-content" /><View style={styles.topbar}><View><Text style={styles.logo}>LookChat</Text><Text style={styles.topHint}>اكتشف من حولك بأمان</Text></View><TouchableOpacity onPress={() => setTab(tab === 'settings' ? 'nearby' : 'settings')} style={styles.avatar}><Text style={styles.avatarText}>{(displayName || 'L').slice(0,1).toUpperCase()}</Text></TouchableOpacity></View>
    {tab === 'chat' && chatId ? <View style={styles.chatWrap}><View style={styles.chatHeader}><TouchableOpacity onPress={() => { setTab('nearby'); setChatId(null); setChatPartner(null); }}><Text style={styles.chatBack}>رجوع</Text></TouchableOpacity><Text style={styles.chatTitle}>{chatPartner?.display_name || 'محادثة'}</Text><TouchableOpacity onPress={() => loadChatMessages(chatId)}><Text style={styles.chatBack}>تحديث</Text></TouchableOpacity></View><FlatList style={styles.chatList} data={chatMessages} keyExtractor={item => item.id} renderItem={({item}) => <View style={[styles.bubble, item.sender_id === session.user.id ? styles.myBubble : styles.theirBubble]}><Text style={[styles.bubbleText, item.sender_id === session.user.id && styles.myBubbleText]}>{item.body}</Text></View>} ListEmptyComponent={<Text style={styles.small}>ابدأ المحادثة برسالة ترحيب.</Text>} /><View style={styles.composer}><TextInput value={draft} onChangeText={setDraft} placeholder='اكتب رسالتك...' style={styles.messageInput} multiline /><TouchableOpacity disabled={busy || !draft.trim()} onPress={sendMessage} style={styles.sendButton}><Text style={styles.sendText}>إرسال</Text></TouchableOpacity></View></View> : tab === 'settings' ? <ScrollView contentContainerStyle={styles.content}><View style={styles.panel}><Text style={styles.heading}>إعدادات الحساب</Text><Text style={styles.label}>الاسم الظاهر</Text><TextInput value={displayName} onChangeText={setDisplayName} placeholder="اكتب اسمك" style={styles.input} /><Text style={styles.body}>الظهور اختياري. عند إيقافه لن يظهر حسابك في نتائج البحث.</Text><TouchableOpacity disabled={busy} style={styles.primary} onPress={() => savePresence(visible)}><Text style={styles.primaryText}>حفظ الاسم</Text></TouchableOpacity><TouchableOpacity style={styles.secondary} onPress={signOut}><Text style={styles.secondaryText}>تسجيل الخروج</Text></TouchableOpacity></View></ScrollView>
    : <ScrollView contentContainerStyle={styles.content}><View style={styles.hero}><Text style={styles.heroTitle}>أشخاص قريبون منك</Text><Text style={styles.heroText}>موقعك لا يظهر للآخرين؛ نعرض المسافة التقريبية فقط.</Text><View style={styles.rangeRow}><View style={styles.rangeHeader}><Text style={styles.label}>نطاق البحث</Text><Text style={styles.radiusValue}>{radius} كم</Text></View><RadiusSlider value={radius} onValueChange={setRadius} /></View><TouchableOpacity disabled={busy} style={styles.primary} onPress={findNearby}><Text style={styles.primaryText}>{busy ? 'جارٍ البحث...' : 'ابحث عن القريبين'}</Text></TouchableOpacity></View>
      <View style={styles.mapPanel}><View style={styles.mapHeading}><Text style={styles.sectionTitle}>الخريطة التفاعلية</Text><Text style={styles.small}>الدبابيس تقريبية لحماية خصوصية الجميع</Text></View><NearbyMap currentLocation={myLocation} people={people} radiusKm={radius} /></View>
      <View style={styles.presence}><View style={{flex:1}}><Text style={styles.presenceTitle}>{visible ? 'أنت ظاهر الآن' : 'أنت غير ظاهر'}</Text><Text style={styles.small}>{visible ? 'يمكن للأشخاص القريبين العثور عليك.' : 'فعّل الظهور حتى يراك الآخرون.'}</Text></View><TouchableOpacity style={[styles.toggle, visible && styles.toggleOn]} onPress={() => savePresence(!visible)}><Text style={styles.toggleText}>{visible ? 'إيقاف' : 'ظهور'}</Text></TouchableOpacity></View>
      <Text style={styles.sectionTitle}>الأشخاص المتاحون ({people.length})</Text>{people.length === 0 ? <View style={styles.empty}><Text style={styles.emptyIcon}>⌖</Text><Text style={styles.emptyTitle}>لا توجد نتائج حتى الآن</Text><Text style={styles.small}>اضغط «ابحث عن القريبين» بعد السماح بالموقع.</Text></View> : <FlatList scrollEnabled={false} data={people} keyExtractor={item => item.user_id} renderItem={({item}) => <View style={styles.person}><View style={styles.personAvatar}><Text style={styles.personInitial}>{(item.display_name || '?').slice(0,1)}</Text></View><View style={{flex:1}}><Text style={styles.personName}>{item.display_name}</Text><Text style={styles.small}>{item.distance_m < 1000 ? 'على بُعد ' + item.distance_m + ' متر' : 'على بُعد ' + (item.distance_m/1000).toFixed(1) + ' كم'}</Text><TouchableOpacity onPress={() => openChat(item)} style={styles.chatButton}><Text style={styles.chatButtonText}>دردشة</Text></TouchableOpacity></View><Text style={styles.online}>●</Text></View>} />}
    </ScrollView>}
    {tab !== 'chat' && <View style={styles.bottom}><TouchableOpacity onPress={() => setTab('nearby')}><Text style={[styles.bottomItem,tab==='nearby' && styles.bottomActive]}>القريبون</Text></TouchableOpacity><TouchableOpacity onPress={() => setTab('settings')}><Text style={[styles.bottomItem,tab==='settings' && styles.bottomActive]}>حسابي</Text></TouchableOpacity></View>}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
 page:{flex:1,backgroundColor:palette.bg},chatWrap:{flex:1,padding:14,width:'100%',maxWidth:900,alignSelf:'center'},chatHeader:{height:52,flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderColor:palette.line,marginBottom:10},chatTitle:{fontSize:17,fontWeight:'800',color:palette.ink},chatBack:{color:palette.brand,fontWeight:'800'},chatList:{flex:1},bubble:{maxWidth:'82%',padding:12,borderRadius:15,marginVertical:5},myBubble:{alignSelf:'flex-end',backgroundColor:palette.brand,borderBottomRightRadius:4},theirBubble:{alignSelf:'flex-start',backgroundColor:'#fff',borderBottomLeftRadius:4,borderWidth:1,borderColor:palette.line},bubbleText:{color:palette.ink,lineHeight:21},myBubbleText:{color:'#fff'},composer:{flexDirection:'row-reverse',alignItems:'center',gap:8,paddingTop:10},messageInput:{flex:1,minHeight:46,maxHeight:110,backgroundColor:'#fff',borderRadius:14,paddingHorizontal:12,paddingVertical:10,textAlign:'right',borderWidth:1,borderColor:palette.line},sendButton:{backgroundColor:palette.brand,paddingHorizontal:16,paddingVertical:14,borderRadius:12},sendText:{color:'#fff',fontWeight:'800'},chatButton:{alignSelf:'flex-end',marginTop:8,backgroundColor:palette.soft,paddingHorizontal:14,paddingVertical:7,borderRadius:9},chatButtonText:{color:palette.brand,fontWeight:'800'},center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:palette.bg},authWrap:{flex:1,justifyContent:'center',padding:24,width:'100%',maxWidth:480,alignSelf:'center'},brandMark:{width:58,height:58,borderRadius:20,backgroundColor:palette.brand,alignItems:'center',justifyContent:'center',alignSelf:'center',marginBottom:12},brandMarkText:{fontSize:30,fontWeight:'800',color:'#fff'},logo:{fontSize:28,fontWeight:'800',color:palette.ink,textAlign:'center'},subtitle:{color:palette.muted,textAlign:'center',marginTop:6,marginBottom:28},panel:{backgroundColor:palette.card,borderRadius:22,padding:20,borderWidth:1,borderColor:palette.line},heading:{fontSize:21,fontWeight:'800',color:palette.ink,marginBottom:16,textAlign:'right'},label:{fontSize:13,fontWeight:'700',color:palette.ink,marginBottom:8,textAlign:'right'},input:{backgroundColor:'#F8FAFB',borderColor:palette.line,borderWidth:1,borderRadius:12,paddingHorizontal:14,paddingVertical:13,marginBottom:16,textAlign:'right',color:palette.ink},primary:{backgroundColor:palette.brand,padding:15,borderRadius:13,alignItems:'center',marginTop:8},primaryText:{color:'#fff',fontWeight:'800',fontSize:15},secondary:{padding:14,alignItems:'center',marginTop:5},secondaryText:{color:palette.brand,fontWeight:'800'},body:{color:palette.muted,lineHeight:22,textAlign:'right',marginBottom:12},topbar:{paddingHorizontal:20,paddingVertical:15,flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between',backgroundColor:palette.card,width:'100%',maxWidth:960,alignSelf:'center'},topHint:{color:palette.muted,textAlign:'right',fontSize:12,marginTop:3},avatar:{width:44,height:44,borderRadius:16,backgroundColor:palette.soft,alignItems:'center',justifyContent:'center'},avatarText:{color:palette.brand,fontSize:18,fontWeight:'800'},content:{padding:16,paddingBottom:24,width:'100%',maxWidth:960,alignSelf:'center'},hero:{backgroundColor:palette.card,borderRadius:22,padding:18,borderWidth:1,borderColor:palette.line},heroTitle:{fontSize:22,fontWeight:'800',color:palette.ink,textAlign:'right'},heroText:{color:palette.muted,textAlign:'right',lineHeight:21,marginTop:6,marginBottom:16},rangeRow:{marginBottom:8},rangeHeader:{flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between'},radiusValue:{color:palette.brand,fontWeight:'900',fontSize:16},radiusSlider:{width:'100%',height:42},mapPanel:{marginTop:14,backgroundColor:palette.card,borderRadius:20,padding:10,borderWidth:1,borderColor:palette.line},mapHeading:{paddingHorizontal:6,paddingBottom:8},small:{fontSize:12,color:palette.muted,textAlign:'right'},presence:{marginTop:14,backgroundColor:palette.soft,borderRadius:16,padding:15,flexDirection:'row-reverse',alignItems:'center'},presenceTitle:{fontWeight:'800',color:palette.ink,textAlign:'right',marginBottom:4},toggle:{backgroundColor:'#DCE5E7',paddingHorizontal:16,paddingVertical:10,borderRadius:10},toggleOn:{backgroundColor:palette.brand},toggleText:{fontWeight:'800',color:palette.ink},sectionTitle:{fontSize:18,fontWeight:'800',color:palette.ink,textAlign:'right',marginTop:22,marginBottom:12},empty:{backgroundColor:palette.card,borderRadius:18,padding:25,alignItems:'center'},emptyIcon:{fontSize:38,color:palette.brand},emptyTitle:{fontWeight:'800',fontSize:16,color:palette.ink,marginTop:8,marginBottom:5},person:{backgroundColor:palette.card,padding:14,borderRadius:15,marginBottom:9,flexDirection:'row-reverse',alignItems:'center',gap:12},personAvatar:{width:44,height:44,borderRadius:15,backgroundColor:palette.soft,alignItems:'center',justifyContent:'center'},personInitial:{fontWeight:'800',fontSize:18,color:palette.brand},personName:{fontWeight:'800',color:palette.ink,textAlign:'right',marginBottom:4},online:{color:palette.brand},bottom:{height:60,backgroundColor:palette.card,borderTopWidth:1,borderColor:palette.line,flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-around'},bottomItem:{color:palette.muted,fontWeight:'700',padding:12},bottomActive:{color:palette.brand}
});
