Translate = Class.create(Base, {

  
  afterInitialize: function(){
    this.from = new Translate.IO($('from'));
    this.to = new Translate.IO($('to'));
    this.from.set('language', '');
    this.to.set('language', 'en');
    this.observe();
    google.language.getBranding($('branding'));
    console.log('init');
  },

  observe: function(){
    var that = this,
        translate = function(source, target){
          if (source.get('text')) {
            target.set('loading', true);
            var lang = target.get('language');
            if (!lang) { lang = 'en'; target.set('language', lang); }
            source.translate(lang);
          } else {
            target.setText('');
          }
        };

    this.from.listen('text changed', function(text){ translate(that.from, that.to); });
    this.to.listen('text changed', function(text){ translate(that.to, that.from); });
    this.from.listen('language changed', function(text){ translate(that._source, that._target); });
    this.to.listen('language changed', function(text){ translate(that._source, that._target); });
    this.from.listen('translated', function(result){
      that._source = that.from; //Keep track of last translation's source & target
      that._target = that.to;
      that.to.setText(result.translation);
      that.to.set('loading', false);
    });
    this.to.listen('translated', function(result){
      that._source = that.to;
      that._target = that.from;
      that.from.setText(result.translation);
      that.from.set('loading', false);
    });
  },

  showPrefs: function(){
    var front = $("front"),
        back = $("back");

    if (window.widget) widget.prepareForTransition("ToBack");
 
    front.style.display="none";
    back.style.display="block";
 
    if (window.widget) setTimeout ('widget.performTransition();', 0);
  },

  hidePrefs: function(){
    var front = $("front"),
        back = $("back");

    if (window.widget) widget.prepareForTransition("ToFront");
 
    front.style.display="block";
    back.style.display="none";
 
    if (window.widget) setTimeout ('widget.performTransition();', 0);
  }

});


Translate.IO = Class.create(ElementBase, {

  extractValueFromElement: function(el){ return el.value; },
  insertValueInElement: function(el, v){ el.value = v; },

  getLoadingValue: function(){ return this.element.hasClassName('loading'); },
  setLoadingValue: function(b){ this.element[b ? 'addClassName' : 'removeClassName']('loading'); },

  afterInitialize: function(){
    this.observe();
    this.getElement('language').update(Object.keys(Translate.languages).map(function(l){ return '<option value="'+Translate.languages[l]+'">'+l+'</option>'; }).join());
  },
  
  translate: function(to){
    var that = this;
    Translate.translate({text: this.get('text'), type: 'text'}, this.get('language') || '', to, function(result){
      that.fire('translated', result);
    });
  },

  observe: function(){
    var element = this.getElement('text');
    this._value = element.value;
    var that = this,
        interval = setInterval(function(){
          if (element.value != that._value) {
            that.fire('text changed', element.value, that._value);
            that._value = element.value;
          }
        }, 2000);

    this.getElement('language').observe('change', function(){
      that.fire('language changed');
    });

    this.listen('translated', function(res){
      if (res.detectedSourceLanguage) that.set('language', res.detectedSourceLanguage);
    });
  },

  setText: function(text, notice){
    if (!notice) this._value = text;
    this.set('text', text);
  }

});



Translate.languages = google.language.Languages;
Translate.translate = google.language.translate;
Translate.b = new Broadcaster();



Translate.b.listen('ready', function(){
  Translate.instance = new Translate();
});

if (window.widget) {
  widget.onshow = function(){
    Translate.b.fire('widget show');
  };
}
