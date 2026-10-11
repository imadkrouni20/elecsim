window.I18N = {
  lang: 'ar',
  S: {
    ar: {
      walk:'مشي', fly:'طيران', select:'تحديد', wall:'جدار', opening:'فتحة',
      lamp:'مصباح', switch:'مفتاح', socket:'مقبس', wire:'سلك',
      move:'نقل', link:'ربط', delete:'حذف', measure:'قياس',
      tools:'أدوات', electric:'كهرباء', board:'لوحة', project:'مشروع',
      circuits:'الدارات', check:'التحقق', stats:'إحصاء', settings:'إعدادات',
      save:'حفظ', load:'تحميل', exportJ:'تصدير', importJ:'استيراد', reset:'جديد',
      undo:'تراجع', redo:'إعادة', lang:'اللغة',
      hint:'اختر تبويبًا من الأسفل. اضغط على أي عنصر للتفاعل.',
      unlinked:'غير مرتبط', linked:'مرتبط',
      addCircuit:'+ دارة جديدة', assignCircuits:'توزيع المصابيح على الدارات',
      breaker:'قاطع', mainBreaker:'القاطع الرئيسي',
      noLamps:'لا مصابيح', noCircuits:'لا دارات',
      allOk:'التركيب سليم ✓', issues:'مشاكل تحتاج مراجعة',
      areUSure:'هل أنت متأكد؟'
    },
    fr: {
      walk:'Marche', fly:'Vol', select:'Sélection', wall:'Mur', opening:'Ouverture',
      lamp:'Lampe', switch:'Interrupteur', socket:'Prise', wire:'Fil',
      move:'Déplacer', link:'Lier', delete:'Suppr.', measure:'Mesurer',
      tools:'Outils', electric:'Élec', board:'Tableau', project:'Projet',
      circuits:'Circuits', check:'Contrôle', stats:'Stats', settings:'Réglages',
      save:'Sauver', load:'Charger', exportJ:'Export', importJ:'Import', reset:'Nouveau',
      undo:'Annuler', redo:'Refaire', lang:'Langue',
      hint:'Choisissez un onglet. Touchez un objet pour interagir.',
      unlinked:'Non lié', linked:'Lié',
      addCircuit:'+ Circuit', assignCircuits:'Assigner les lampes',
      breaker:'Disj.', mainBreaker:'Disjoncteur principal',
      noLamps:'Aucune lampe', noCircuits:'Aucun circuit',
      allOk:'Installation OK ✓', issues:'à vérifier',
      areUSure:'Êtes-vous sûr ?'
    },
    en: {
      walk:'Walk', fly:'Fly', select:'Select', wall:'Wall', opening:'Opening',
      lamp:'Lamp', switch:'Switch', socket:'Socket', wire:'Wire',
      move:'Move', link:'Link', delete:'Delete', measure:'Measure',
      tools:'Tools', electric:'Electric', board:'Board', project:'Project',
      circuits:'Circuits', check:'Check', stats:'Stats', settings:'Settings',
      save:'Save', load:'Load', exportJ:'Export', importJ:'Import', reset:'New',
      undo:'Undo', redo:'Redo', lang:'Language',
      hint:'Pick a tab. Tap an object to interact.',
      unlinked:'Unlinked', linked:'Linked',
      addCircuit:'+ Circuit', assignCircuits:'Assign lamps',
      breaker:'Breaker', mainBreaker:'Main breaker',
      noLamps:'No lamps', noCircuits:'No circuits',
      allOk:'Installation OK ✓', issues:'to check',
      areUSure:'Are you sure?'
    }
  },
  t: function(k){ return (this.S[this.lang] && this.S[this.lang][k]) || k; },
  cycle: function(){
    var order = ['ar','fr','en'];
    this.lang = order[(order.indexOf(this.lang)+1) % 3];
    document.documentElement.lang = this.lang;
    document.documentElement.dir = (this.lang === 'ar') ? 'rtl' : 'ltr';
    return this.lang;
  }
};
