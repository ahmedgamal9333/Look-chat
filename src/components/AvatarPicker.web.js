import React from 'react';

export default function AvatarPicker({ avatarUrl, onSelect, disabled }) {
  const image = avatarUrl
    ? React.createElement('img', { src: avatarUrl, alt: 'الصورة الشخصية', style: { width: 92, height: 92, borderRadius: 28, objectFit: 'cover', border: '3px solid #d9eee9' } })
    : React.createElement('div', { style: { width: 92, height: 92, borderRadius: 28, background: '#e5f4f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#087f72', fontSize: 34, fontWeight: 800 } }, 'L');
  return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 20 } },
    image,
    React.createElement('label', { style: { background: '#e5f4f1', color: '#087f72', padding: '10px 18px', borderRadius: 12, fontWeight: 800, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? .6 : 1 } },
      disabled ? 'جارٍ الحفظ...' : 'تغيير الصورة',
      React.createElement('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', disabled, style: { display: 'none' }, onChange: event => { const file = event.target.files?.[0]; if (file) onSelect(file); event.target.value = ''; } })
    ),
    React.createElement('span', { style: { color: '#74808c', fontSize: 11 } }, 'JPG أو PNG أو WEBP · حتى 3 ميجابايت')
  );
}
