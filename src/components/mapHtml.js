export function createMapHtml({ currentLocation, people = [], radiusKm = 10 }) {
  const payload = JSON.stringify({
    currentLocation: currentLocation && Number.isFinite(currentLocation.latitude) && Number.isFinite(currentLocation.longitude) ? { latitude: currentLocation.latitude, longitude: currentLocation.longitude } : null,
    radiusKm: Math.max(1, Math.min(500, Number(radiusKm) || 10)),
    people: people.filter(person => person.map_lat != null && person.map_lon != null && Number.isFinite(Number(person.map_lat)) && Number.isFinite(Number(person.map_lon))).map(person => ({
      userId: String(person.user_id || ''),
      latitude: Number(person.map_lat),
      longitude: Number(person.map_lon),
      name: String(person.display_name || 'مستخدم LookChat'),
      bio: String(person.bio || ''),
      avatarUrl: String(person.avatar_url || ''),
      distance: Number(person.distance_m) || 0
    }))
  }).replace(/</g, '\\u003c');
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><style>
*{box-sizing:border-box}html,body,#map{height:100%;width:100%;margin:0;padding:0;background:#e9f1ef;font-family:Arial,sans-serif}.leaflet-container{font-family:Arial,sans-serif}.leaflet-control-zoom{border:0!important;box-shadow:0 5px 18px #1c343322!important;border-radius:12px!important;overflow:hidden}.leaflet-control-zoom a{color:#173b37!important}.leaflet-control-attribution{font-size:9px;background:#ffffffb8!important}.user-pin{width:48px;height:58px;position:relative;filter:drop-shadow(0 5px 7px #153b3444)}.user-pin:before{content:'';position:absolute;left:9px;top:2px;width:34px;height:34px;border-radius:50% 50% 50% 7px;transform:rotate(-45deg);background:#fff;border:2px solid #fff}.user-pin img,.user-pin .fallback{position:absolute;left:13px;top:6px;width:26px;height:26px;border-radius:50%;object-fit:cover;z-index:1;background:#d8eee9}.user-pin .fallback{display:flex;align-items:center;justify-content:center;color:#087f72;font-weight:800}.user-pin .live{position:absolute;z-index:3;right:3px;top:1px;width:12px;height:12px;border-radius:50%;background:#19b879;border:2px solid white}.me-pin{width:24px;height:24px;border-radius:50%;background:#2477ee;border:4px solid white;box-shadow:0 2px 12px #174a9b88}.leaflet-popup-content-wrapper{border-radius:18px!important;box-shadow:0 10px 30px #142f2a22!important}.leaflet-popup-content{margin:13px!important;min-width:190px;font-size:13px;line-height:1.7;text-align:right}.person-card{display:flex;align-items:center;gap:10px}.person-card img,.person-card .fallback{width:48px;height:48px;flex-shrink:0;border-radius:16px;object-fit:cover;background:#e3f3ef}.person-card .fallback{display:flex;align-items:center;justify-content:center;font-size:20px;color:#087f72;font-weight:800}.person-name{font-size:15px;font-weight:800;color:#18312e}.person-bio{color:#71817e;font-size:12px;margin:8px 0;max-width:230px;overflow-wrap:anywhere}.person-distance{font-size:11px;color:#087f72;font-weight:700}.chat-action{width:100%;border:0;border-radius:11px;padding:10px;background:#087f72;color:white;font-weight:800;font-size:13px;margin-top:10px;cursor:pointer}.map-note{position:absolute;z-index:500;top:12px;left:12px;padding:7px 11px;background:#ffffffed;border:1px solid #e2ebe8;border-radius:20px;color:#58716c;font-size:11px;box-shadow:0 4px 14px #17352f12}
</style></head><body><div id="map"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>
const data = ${payload};
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeImage=value=>(value.startsWith('https://')||value.startsWith('http://'))?escapeHtml(value):'';
const fallback=[26.8206,30.8025];const center=data.currentLocation?[data.currentLocation.latitude,data.currentLocation.longitude]:fallback;
const map=L.map('map',{zoomControl:true,scrollWheelZoom:true}).setView(center,data.currentLocation?12:5);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{maxZoom:19,attribution:'© OpenStreetMap © CARTO'}).addTo(map);
const note=document.createElement('div');note.className='map-note';note.textContent='● متصلون الآن  ·  المواقع تقريبية';document.body.appendChild(note);
if(data.currentLocation){
 L.marker(center,{icon:L.divIcon({className:'',html:'<div class="me-pin"></div>',iconSize:[24,24],iconAnchor:[12,12]})}).addTo(map).bindPopup('موقعك الحالي (ظاهر لك فقط)');
 const circle=L.circle(center,{radius:data.radiusKm*1000,color:'#087f72',weight:2,fillColor:'#20a58d',fillOpacity:.06}).addTo(map);
 const bounds=circle.getBounds();
 data.people.forEach(person=>{
  const point=[person.latitude,person.longitude],distance=person.distance<1000?Math.round(person.distance)+' متر':(person.distance/1000).toFixed(1)+' كم';
  const name=escapeHtml(person.name),bio=escapeHtml(person.bio),image=safeImage(person.avatarUrl);
  const photo=image?'<img src="'+image+'" alt="" referrerpolicy="no-referrer">':'<span class="fallback">'+escapeHtml((person.name||'L').slice(0,1))+'</span>';
  const icon=L.divIcon({className:'',html:'<div class="user-pin">'+photo+'<i class="live"></i></div>',iconSize:[48,58],iconAnchor:[24,54]});
  const popup='<div class="person-card">'+(image?'<img src="'+image+'" alt="">':'<span class="fallback">'+escapeHtml((person.name||'L').slice(0,1))+'</span>')+'<div><div class="person-name">'+name+'</div><div class="person-distance">● متصل الآن · '+distance+'</div></div></div>'+(bio?'<div class="person-bio">'+bio+'</div>':'')+'<button class="chat-action" data-open-user="'+escapeHtml(person.userId)+'">ابدأ محادثة</button>';
  L.marker(point,{icon}).addTo(map).bindPopup(popup);
  bounds.extend(point);
 });
 map.fitBounds(bounds,{padding:[35,35],maxZoom:15});
}else{L.marker(fallback).addTo(map).bindPopup('اسمح بالوصول إلى موقعك ثم اضغط «ابحث عن القريبين»');}
document.addEventListener('click',event=>{const button=event.target.closest('[data-open-user]');if(!button)return;const person=data.people.find(item=>item.userId===button.getAttribute('data-open-user'));if(person){const message=JSON.stringify({type:'lookchat-open-user',person});if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(message);else parent.postMessage(JSON.parse(message),'*');}});
setTimeout(()=>map.invalidateSize(),250);
</script></body></html>`;
}
