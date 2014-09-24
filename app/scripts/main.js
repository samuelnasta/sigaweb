'use strict';


/*
Mapa de unidades feito usando GeoJSON para criar os pontos facilmente
http://geojson.io/
*/


/* Variáveis para o Google Maps */
var google, infoWindow = null, latLng, map, marker;



/* Média de tempo de espera */
window.averageTime = function(time, attendance) {
	return window.toTime(window.toSeconds(time) / attendance);
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
	});
};



window.showCompanyUnit = function(name, unit) {
	$('#unidade').animate({'left': '100%'}, 0).animate({'left': '0%'}, 300).addClass('active');
	$('#nome-unidade').text(name);
	
	$.getJSON('json/' + unit + '.json', function(json) {
		$('#unidade-atendimentos').html(json.Atendimentos);
		$('#unidade-cancelamentos').html(json.Cancelamentos);
		$('#unidade-espera').html(json.Espera);
		$('#unidade-media-espera').html(window.averageTime(json.Espera, json.Atendimentos));

		$('#unidade-usuarios').html(json.Usuarios);
		$('#unidade-logados').html(json.Logados);

		$('#unidade-aguardando').html(json.Aguardando);
		$('#unidade-aguardando-15min').html(json.Aguardando15min);
		$('#unidade-aguardando-30min').html(json.Aguardando30min);
		$('#unidade-aguardando-60min').html(json.Aguardando60min);

	});
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
	$('#panorama').animate({'top': '0'}, 500);


	/* Mostra o panorama dos atendimentos naquele momento */
	$.getJSON('json/atendimentos.json', function(json) {
		$('#atendimentos').html(json.Atendimentos);
		$('#cancelamentos').html(json.Cancelamentos);
		$('#espera').html(json.Espera);
		$('#media-espera').html(window.averageTime(json.Espera, json.Atendimentos));
	});


	/* Inicializa o Google Maps quando o usuário clica em Mapas.
	Se ele for iniciado quando a página carrega, os mapas são mostrados faltando pedaços */
	$('#menu-mapa').on('click', function() {
		window.setTimeout(function() {
			/* Centraliza o mapa onde o usuário está. Se ele não permitir esse recurso, centraliza em Belo Horizonte */
			if(!navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(window.initializeMap);
			} else {
				window.initializeMap();
			}
		}, 1000);
	});


	/* Mostra a tela de Ver unidade quando clica no link do marcador */
	$('#map-canvas').on('click', '.ver-unidade', function() {
		window.showCompanyUnit($(this).attr('data-nome'), $(this).attr('data-unidade'));
	});


	$('#voltar-mapa').on('click', function() {
		$('#unidade').animate({'left': '100%'}, 300, function() { $(this).removeClass('active'); });
		$('#campo-busca').select();
	});





	/* Auto complete */
	$('#campo-busca').unbind('blur');
	$.getJSON('json/list.json', function(json) {
		$('#campo-busca').autocomplete({
		    lookup: json,
		    fillin: true,
		    onSelect: function (suggestion) {
		        console.log('You selected: ' + suggestion.value + ', ' + suggestion.data);
		        window.showCompanyUnit(suggestion.value, suggestion.data);
		    }
		});
	});
	

});