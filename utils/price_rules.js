const pricingRules = {
	agePrices: {
		"0-12": 0.05, //Enfants
		"13-17": 0.055, //Adolescents
		"18-25": 0.06, //Jeunes adultes
		"26-35": 0.1, //Adultes
		"36-45": 0.15, //Adultes
		"46-54": 0.2, //Adultes d'âge moyen
		"55-64": 0.25, //Préretraités
		"65+": 0.3, //Seniors
	},
	app_sizePrices: {
		"0-100": 0.1,
		"101-200": 0.15,
		"201-300": 0.2,
		"301-400": 0.25,
		"401-500": 0.3,
		"501-600": 0.35,
		"601-700": 0.4,
		"701-800": 0.45,
		"801-900": 0.5,
		"901-1000": 0.55,
		"1001-1100": 0.6,
		"1101-1200": 0.65,
		"1201-1300": 0.7,
		"1301-1400": 0.75,
		"1401-1500": 0.8,
		"1501-1600": 0.9,
		"1601-1700": 0.95,
		"1701-1800": 1,
		"1801-1900": 1.5,
		"1901-2000": 2,
	},

	hobbies: {
		game: 100,
		entertainment: 100,
		social: 200,
		productivity: 150,
		communication: 180,
		music_audio: 120,
		photography: 220,
		shopping: 300,
		education: 100,
		art_design: 100,
		personalisation: 200,
		weather: 220,
		beauty: 300,
		auto_vehicles: 100,
		map_navigation: 200,
	},

	businessPrices: {
		non_profit: 0.1,
		retail: 0.1,
		manufacturing: 0.1,
		it_service: 0.19,
		healthcare: 0.17,
		finance: 0.1,
		hospitality: 0.1,
		construction: 0.1,
		education: 0.1,
		transportation: 0.1,
		real_estate: 0.1,
		food_service: 0.1,
		entertainment: 0.1,
		consulting: 0.1,
		agriculture: 0.1,
		ecommerce: 0.1,
		influencer: 0.18,
		sports: 0.1,
		industry: 0.1,
		energy: 0.1,
	},
};
module.exports = {pricingRules};
