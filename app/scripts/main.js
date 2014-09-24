'use strict';


/*
Mapa de unidades feito usando GeoJSON para criar os pontos facilmente
http://geojson.io/
*/


/* Variáveis para Google Maps */
var google, infoWindow = null, latLng, map, marker;
/* Variáveis para Auto refresh */
var ajustesAutoRefresh, ajustesMaxTempo, menuAutoRefresh = null, timeoutAutoRefresh;



/* Auto refresh JSON */
window.autoRefresh = function() {
	ajustesAutoRefresh = (localStorage.ajustesAutoRefresh) ? localStorage.ajustesAutoRefresh : 1;
	window.clearTimeout(timeoutAutoRefresh);
	if(menuAutoRefresh === 'panorama' || menuAutoRefresh === 'unidade') {
		timeoutAutoRefresh = window.setTimeout(function() {
			if(menuAutoRefresh === 'panorama') {
				window.refreshDashboard();
			} else if (menuAutoRefresh === 'unidade') {
				window.refreshUnit(window.unit);
			}
			window.autoRefresh();
		}, ajustesAutoRefresh * 1000 * 60);
	}
};



/* Média de tempo de espera. Se for maior aplica classe de underperformance */
window.averageTime = function(time, attendance, div) {
	ajustesMaxTempo = (localStorage.ajustesMaxTempo) ? localStorage.ajustesMaxTempo : 5;
	div.addClass('underperforming');
	var partialTime = window.toSeconds(time) / attendance;
	if(partialTime > ajustesMaxTempo * 60) {
		div.addClass('underperforming');
	}
	return window.toTime(partialTime);
};



/* Gera link quando o usuário clica no marcador */
window.infoWindowCallback = function() {
	infoWindow.setContent('<a class="ver-unidade" href="javascript:;" data-nome="' + this.title + '" data-unidade="' + this.id + '">' + this.title + '</a>');
	infoWindow.open(map, this);
};



/* Inicializa o mapa */
window.initializeMap = function(position) {
	if(position) {
		latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
	} else {
		latLng = new google.maps.LatLng(-19.9059, -43.9566);
	}
	var options = {
		zoom: 12,
		center: latLng,
		mapTypeControl: true, /* Botões mapa/satélite */
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		navigationControlOptions: {
			style: google.maps.NavigationControlStyle.ANDROID
		}
	};
	map = new google.maps.Map(document.getElementById('map-canvas'), options);
	infoWindow = new google.maps.InfoWindow({ content: 'Carregando...' });

	window.loadMarkers();
};



/* Busca o GeoJSON com as unidades e cria os marcadores no mapa */
window.loadMarkers = function() {
	$.getJSON('json/unidades.json', function(json) {
		for (var i = 0; i < json.features.length; i++) {
			var coords = json.features[i].geometry.coordinates;
			var id = json.features[i].properties.id;
			var title = json.features[i].properties.title;
			var latLng = new google.maps.LatLng(coords[1], coords[0]);

			marker = new google.maps.Marker({
				icon: 'http://www.googlemapsmarkers.com/v1/009900/',
                id: id,
				position: latLng,
				map: map,
				title: title
			});

            google.maps.event.addListener(marker, 'click', window.infoWindowCallback);
		}
	});
};



/* Cria a animação dos botões de navegação */
window.menuSlide = function(menu) {
	$('#menu-' + menu).on('click', function() {
		$('.active').animate({'top': '100%'}, 300).fadeOut(300, function() {
			$('[role=section]').removeClass('active');
			$('#' + menu).addClass('active').animate({'top': '0'}, 500);
			$('[role=section]:not(.active)').animate({'top': '100%'}, 0);
		});

		window.menuAutoRefresh = menu;
		window.autoRefresh();
	});
};



/* Mostra o panorama dos atendimentos naquele momento */
window.refreshDashboard = function() {
	$.getJSON('json/atendimentos.json', function(json) {
		$('#atendimentos').fadeTo(100, 0.3).fadeTo(250, 1).html(json.Atendimentos);
		$('#cancelamentos').fadeTo(100, 0.3).fadeTo(250, 1).html(json.Cancelamentos);
		$('#espera').fadeTo(100, 0.3).fadeTo(250, 1).html(json.Espera);
		$('#media-espera').fadeTo(100, 0.3).fadeTo(250, 1).html(window.averageTime(json.Espera, json.Atendimentos, $('#media-espera')));
	});
};



/* Mostra os dados de determinada unidade */
window.refreshUnit = function(unit) {
	$.getJSON('json/' + unit + '.json', function(json) {
		$('#unidade-atendimentos').fadeTo(100, 0.3).fadeTo(250, 1).html(json.Atendimentos);
		$('#unidade-cancelamentos').fadeTo(100, 0.3).fadeTo(250, 1).html(json.Cancelamentos);
		$('#unidade-espera').fadeTo(100, 0.3).fadeTo(250, 1).html(json.Espera);
		$('#unidade-media-espera').fadeTo(100, 0.3).fadeTo(250, 1).html(window.averageTime(json.Espera, json.Atendimentos, $('#unidade-media-espera')));

		$('#unidade-usuarios').fadeTo(100, 0.3).fadeTo(250, 1).html(json.Usuarios);
		$('#unidade-logados').fadeTo(100, 0.3).fadeTo(250, 1).html(json.Logados);

		$('#unidade-aguardando').fadeTo(100, 0.3).fadeTo(250, 1).html(json.Aguardando);
		$('#unidade-aguardando-15min').fadeTo(100, 0.3).fadeTo(250, 1).html(json.Aguardando15min);
		$('#unidade-aguardando-30min').fadeTo(100, 0.3).fadeTo(250, 1).html(json.Aguardando30min);
		$('#unidade-aguardando-60min').fadeTo(100, 0.3).fadeTo(250, 1).html(json.Aguardando60min);
	});
};



window.showCompanyUnit = function(name, unit) {
	window.unit = unit;
	$('#unidade').animate({'left': '100%'}, 0).animate({'left': '0%'}, 300).addClass('active');
	$('#nome-unidade').text(name);
	window.refreshUnit(unit);
};



/* Conta quantos segundos existe em determinada hora */
window.toSeconds = function(time) {
	var partialTime, finalTime;
	partialTime = time.split(':');
	finalTime = (parseInt(partialTime[0]) * 3600) + (parseInt(partialTime[1]) * 60) + parseInt(partialTime[2]);
	return finalTime;
};



/* Converte os segundos de espera em hora normal */
window.toTime = function(time) {
	var partialTime, finalTime = [];
	partialTime = Math.round(time);

	finalTime[0] = Math.floor(partialTime / 3600);
	partialTime = partialTime % 3600;
	finalTime[1] = Math.floor(partialTime / 60);
	partialTime = partialTime % 60;

	return ('0' + finalTime[0]).slice(-2) + ':' +
		   ('0' + finalTime[1]).slice(-2) + ':' +
		   ('0' + partialTime).slice(-2);
};









$(document).ready(function() {
	window.menuSlide('panorama');
	window.menuSlide('mapa');
	window.menuSlide('busca');
	window.menuSlide('ajustes');
	$('#menu-panorama').click();

	window.refreshDashboard();





	/* Define ajustes */
	if(localStorage.ajustesMaxTempo){
		$('#ajustes-max-tempo').val(localStorage.ajustesMaxTempo);
	}
	$('#ajustes-max-tempo').on('change', function() {
		localStorage.ajustesMaxTempo = $('#ajustes-max-tempo').val();
	});


	if(localStorage.ajustesAutoRefresh){
		$('#ajustes-auto-refresh').val(localStorage.ajustesAutoRefresh);
	}
	$('#ajustes-auto-refresh').on('change', function() {
		localStorage.ajustesAutoRefresh = $('#ajustes-auto-refresh').val();
	});





	/* Inicializa o Google Maps quando o usuário clica em Mapas.
	Se ele for iniciado quando a página carrega, os mapas são mostrados faltando pedaços */
	var flagMap = false;
	$('#menu-mapa').on('click', function() {
		window.setTimeout(function() {
			/* Centraliza o mapa onde o usuário está. Se ele não permitir esse recurso, centraliza em Belo Horizonte */
			/* Verifica se o mapa já foi inicializado para evitar ter que carregá-lo sempre */
			if(!flagMap){
				if(!navigator.geolocation) {
					navigator.geolocation.getCurrentPosition(window.initializeMap);
				} else {
					window.initializeMap();
				}
				flagMap = true;
			}
		}, 1000);
	});



	/* Mostra a tela de Ver unidade quando clica no link do marcador */
	$('#map-canvas').on('click', '.ver-unidade', function() {
		window.showCompanyUnit($(this).attr('data-nome'), $(this).attr('data-unidade'));
		window.unit = $(this).attr('data-unidade');
		window.menuAutoRefresh = 'unidade';
		window.autoRefresh();
	});



	$('#voltar-mapa').on('click', function() {
		$('#unidade').animate({'left': '100%'}, 300, function() { $(this).removeClass('active'); });
		$('#campo-busca').select();
		window.clearTimeout(timeoutAutoRefresh);
	});





	/* Auto complete */
	$('#menu-busca').on('click', function() {
		window.setTimeout(function() {
			$('#campo-busca').focus();
		}, 1000);
		
		$.getJSON('json/lista.json', function(json) {
			$('#campo-busca').autocomplete({
			    lookup: json,
			    minChars: 0,
			    onSelect: function (suggestion) {
					//console.log('You selected: ' + suggestion.value + ', ' + suggestion.data);
			        window.showCompanyUnit(suggestion.value, suggestion.data);
					window.menuAutoRefresh = 'unidade';
					window.autoRefresh();
			    }
			});
		});
	});
});