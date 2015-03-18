var fs = require('fs');
var mkdirp = require('mkdirp');


var attributesHash = {};
var attributes = JSON.parse(fs.readFileSync('./data/Attributes_API_v1.json'));
attributes.RECDATA.forEach(function(a) {
    var key = a.EntityType+':'+a.EntityID
    attributesHash[key] = attributesHash[key] || [];
    delete a.EntityType;
    delete a.EntityID;
    delete a.AttributeID;
    attributesHash[key].push(a);
});


var facilitiesHash = {};
var facilities = JSON.parse(fs.readFileSync('./data/Facilities_API_v1.json'));
facilities.RECDATA.forEach(function(f) {
    Object.keys(f).forEach(function(key){
        if(f[key] === '') {
            delete f[key];
        }
    });
    facilitiesHash[f.FacilityID] = f;
});


var campsites = JSON.parse(fs.readFileSync('./data/Campsites_API_v1.json'));
campsites.RECDATA.forEach(function(campsite) {
    Object.keys(campsite).forEach(function(key){
        if(campsite[key] === '') {
            delete campsite[key];
        }
    });
    campsite.attributes = attributesHash['Campsite:'+campsite.CampsiteID];
    if (facilitiesHash[campsite.FacilityID]) {
        facilitiesHash[campsite.FacilityID].campsites = facilitiesHash[campsite.FacilityID].campsites || [];
        facilitiesHash[campsite.FacilityID].campsites.push(campsite)
    }
});

var addresses = JSON.parse(fs.readFileSync('./data/FacilityAddresses_API_v1.json'));
addresses.RECDATA.forEach(function(address) {

    Object.keys(address).forEach(function(key){
        if(address[key] === '') {
            delete address[key];
        }
    });

    if (facilitiesHash[address.FacilityID]) {
        facilitiesHash[address.FacilityID].address = address;
    }
});



for(f in facilitiesHash) {
    if(facilitiesHash[f].address && facilitiesHash[f].campsites) {
        if(facilitiesHash[f].address.AddressStateCode === "STATE MAPPING BROKEN") {
            facilitiesHash[f].address.AddressStateCode = "BROKEN";
        }
        var path = __dirname+'/../data/'+facilitiesHash[f].address.AddressCountryCode+ (facilitiesHash[f].address.AddressStateCode ? '/'+facilitiesHash[f].address.AddressStateCode : '');
        mkdirp.sync(path);
        var re = /[\s|\/]/gi;
        var filepath = path +'/'+ facilitiesHash[f].FacilityID + '-' + facilitiesHash[f].FacilityName.replace(re, '-') + '.geojson';
        console.log(filepath);


        var geojson = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [
                    facilitiesHash[f].FacilityLongitude,
                    facilitiesHash[f].FacilityLatitude
                ]
            },
            properties: facilitiesHash[f]
        };
        fs.writeFileSync(filepath, JSON.stringify(geojson, null, 2));
    }
}
