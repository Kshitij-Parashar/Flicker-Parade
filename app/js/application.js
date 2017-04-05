/**
 * Created by Kshitij
 */
var FlickerApp = angular.module('formFlickr', ['ui.bootstrap']);

FlickerApp.controller('FlickrController', ['$scope', '$http', '$sce', function ($scope, $http, $sce) {
    $scope.searchCriteria = {};
    $scope.showLoader = 1;
    $scope.likedPicsShown = 0;
    $scope.likedImages = [];
    $scope.currentPage = 1;
    $scope.numPerPage = 28;
    $scope.maxSize = 5;
    $scope.total = "";
    var latitude = "",
        longitude = "";
    var x2js = new X2JS();
    (function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(getPosition);
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    })();
    function getPosition(position) {
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        var latlng = new google.maps.LatLng(latitude, longitude);
        var map = new google.maps.Map(document.getElementById('map'), {
            center: latlng,
            zoom: 11,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });
        var marker = new google.maps.Marker({
            position: latlng,
            map: map,
            title: 'Set lat/lon values for this property',
            draggable: true
        });
        $scope.search($scope.searchCriteria);

        google.maps.event.addListener(marker, 'dragend', function (a) {
            console.log(a);
            latitude = a.latLng.lat().toFixed(4);
            longitude = a.latLng.lng().toFixed(4);
            $scope.search($scope.searchCriteria);
        });
    }

    $scope.search = function (searchCriteria) {

        $scope.likedPicsShown = 0;
        if (searchCriteria.tags == undefined || searchCriteria.tags.trim() == "") {
            searchCriteria.tags = "";
        }

        // build URL for Flickr API
        var flickrAPI = "https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=ca27e05120081ed9f9e99b28853e34a0";

        flickrAPI = flickrAPI + "&tags=" + encodeURIComponent(searchCriteria.tags)
            + "&format=rest"
            + "&lat=" + latitude
            + "&lon=" + longitude
            + "&per_page=" + $scope.numPerPage
            + "&page=" + $scope.currentPage;

        // send AJAX query to Flickr API
        $sce.trustAsResourceUrl(flickrAPI);

        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                $scope.images = [];
                $scope.maxSize = 5;
                // Typical action to be performed when the document is ready:
                var data = x2js.xml_str2json(xhttp.responseText);
                $scope.showLoader = 0;
                if (data.rsp.photos._total == 0) {
                    $scope.images = [];
                    $scope.$digest();
                    return;
                }
                if (data.rsp.photos.photo.hasOwnProperty('_id')) {
                    $scope.images[0] = data.rsp.photos.photo;
                    $scope.images[0]['url'] = 'https://farm' + $scope.images[0]._farm + '.staticflickr.com/' + $scope.images[0]._server + '/' + $scope.images[0]._id + '_' + $scope.images[0]._secret + '.jpg'
                    $scope.images[0]['checked'] = 0;
                    $scope.$digest();
                }
                else {
                    $scope.images = data.rsp.photos.photo;
                    $scope.total = data.rsp.photos._total;
                    for (var image in $scope.images) {
                        $scope.images[image]['url'] = 'https://farm' + $scope.images[image]._farm + '.staticflickr.com/' + $scope.images[image]._server + '/' + $scope.images[image]._id + '_' + $scope.images[image]._secret + '.jpg'
                        $scope.images[image]['checked'] = 0;
                    }
                    $scope.$digest();

                }

            }
        };
        xhttp.open("GET", flickrAPI, true);
        xhttp.send();
    };
    $scope.showLikedPics = function () {
        $scope.likedPicsShown = 1;
        $scope.total = $scope.likedImages.length;
        $scope.currentPage = 1;
        $scope.maxSize = Math.ceil($scope.total / $scope.numPerPage);
        var begin = (($scope.currentPage - 1) * $scope.numPerPage)
            , end = begin + $scope.numPerPage;

        $scope.images = $scope.likedImages.slice(begin, end);
    }
    $scope.liked = function (imgPassed) {
        if ($scope.likedImages.length > 0) {
            var present = 0;
            var index = "";
            for (var image in $scope.likedImages) {
                if ($scope.likedImages[image]._id == imgPassed._id) {
                    present = 1;
                    index = image;
                    break;
                }
            }
            if (present == 0) {
                $scope.likedImages.push(imgPassed);
                imgPassed.checked = 1;
            }
            else {
                $scope.likedImages.splice(index, 1);
                imgPassed.checked = 0;
            }
        }
        else {
            $scope.likedImages.push(imgPassed);
            imgPassed.checked = 1;
        }
    }
    // reset form to initial state
    $scope.resetForm = function (form) {
        $scope.form.tags.$setValidity();
        $scope.images = {};
        $scope.searchCriteria = {};
    };
    $scope.$watch('currentPage', function () {

        if (latitude != "" && $scope.likedPicsShown == 0) {
            $scope.search($scope.searchCriteria);
        }
        else {
            var begin = (($scope.currentPage - 1) * $scope.numPerPage)
                , end = begin + $scope.numPerPage;

            $scope.images = $scope.likedImages.slice(begin, end);
        }
    });

}]);