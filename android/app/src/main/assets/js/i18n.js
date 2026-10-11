window.I18N = {
  lang: 'ar',
  strings: {
    ar:{walk:'مشي',fly:'طيران',select:'تحديد',wall:'جدار',
        hint:'اسحب النصف الأيسر للحركة، الأيمن للنظر. انقر المفتاح على الجدار لتشغيل الإضاءة.'},
    fr:{walk:'Marche',fly:'Vol',select:'Sélection',wall:'Mur',
        hint:'Glissez à gauche pour bouger, à droite pour regarder. Tapez l\'interrupteur.'},
    en:{walk:'Walk',fly:'Fly',select:'Select',wall:'Wall',
        hint:'Drag left to move, right to look. Tap the switch on the wall.'}
  },
  t:function(k){return (this.strings[this.lang]&&this.strings[this.lang][k])||k;},
  apply:function(){
    document.querySelectorAll('[data-i18n]').forEach(function(el){
      el.textContent = I18N.t(el.dataset.i18n);
    });
  }
};
