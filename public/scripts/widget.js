var app = angular.module('app', ['ngSanitize']);

app.factory('widget', function(){
    return {
        rootDomain: 'http://localhost:3000/',
        getPath: function(absUrl) {
            return absUrl.replace(this.rootDomain, '').replace('.html', '');
        }
    };
});

app.factory('data',function($http){
    return {
        dataSource: 'http://localhost:3000/data/',
        authorSource: 'http://localhost:3000/authors/',
        projectSource:'http://localhost:3000/projects/',
        indexSource:'http://localhost:3000/indexes/',
        getPost: async function(path){
            let dataPath = this.dataSource+path.split('/')[2]+'.json';
            return await $http.get(dataPath);
        },
        getAuthor: async function(handle){
            let dataPath = this.authorSource+handle+'.json';
            return await $http.get(dataPath);
        },
        getProject: async function(handle){
            dataPath = this.projectSource+handle+'.json';
            return await $http.get(dataPath);
        },
        getIndex: async function(indexFor){
            dataPath = this.indexSource+indexFor+'.json';
            return await $http.get(dataPath);
        }
    }
});

app.factory('theme', function(){
    return {
        'header':'/themes/greek/header.htm',
        'notFound':'/themes/greek/404.htm',
        'main':'/themes/greek/main.htm',
        'projectPage':'/themes/greek/project-page.htm',
        'standardPostHeader':'/themes/greek/headers/standardpostheader.htm',
        'projectCardTemplate':'/themes/greek/cards/project-card-template.htm',
        'standardArticleTemplate':'/themes/greek/posts/standard-article.htm',
        'standardListingTemplate':'/themes/greek/listings/standard-listing-template.htm'
    };
});


app.controller('mainCtrl', function(
    $templateRequest,
    $sce,
    $compile,
    $scope,
    $http,
    theme
    ){

    $scope.isRender = true;

    $scope.render = function(render) {
        $scope.data = [],
        $templateRequest($sce.getTrustedResourceUrl(render.component)).then(function(theme) {
            if (render.data !== 'undefined') {
                angular.forEach(render.data, function(value, key) {
                    $scope.data[key] = value;
                });
            }
            $compile($('#' + render.element).append(theme))($scope);
        });
    }

    $scope.renderHeader = function(){
        $scope.render({
            element: 'header',
            component: theme.header,
            kind: 'header',
            data: 'undefined'
        });
    }

    $scope.showNotFound = function(){
        $scope.renderHeader();
        $scope.render({
            element: 'main',
            component: theme.notFound,
            kind: 'page',
            data: 'undefined'
        });
        $scope.isRender = false;
    }

});


app.controller('postCtrl', function(
    $templateRequest,
    $sce,
    $compile,
    $scope,
    $http,
    $location,
    widget,
    data,
    theme){

    $scope.isRender = true;

    $scope.render = function(render) {
        $scope.data = [],
        $templateRequest($sce.getTrustedResourceUrl(render.component)).then(function(theme) {
            if (render.data !== 'undefined') {
                angular.forEach(render.data, function(value, key) {
                    $scope.data[key] = value;
                });
            }
            $compile($('#' + render.element).append(theme))($scope);
        });
    }

    $scope.renderHeader = function(){
        $scope.render({
            element: 'header',
            component: theme.header,
            kind: 'header',
            data: 'undefined'
        });
    }

    $scope.showNotFound = function(){
        $scope.renderHeader();
        $scope.render({
            element: 'main',
            component: theme.notFound,
            kind: 'page',
            data: 'undefined'
        });
        $scope.isRender = false;
    }

    $scope.standardArticleTemplate = theme.standardArticleTemplate;


    let postPath = widget.getPath($location.absUrl());
    data.getPost(postPath).then(function(response){
        $scope.post = response.data;
        if (response.data.hasReferenceProject===true) {
            data.getProject(response.data.referenceProject).then(function(projectData){
                $scope.project = projectData.data;
                $scope.project.projectLoadSuccess = true;
                $scope.loadAuthor();
            }).catch(function(){
                $scope.project = new Object;
                $scope.project.projectLoadSuccess = false;
                $scope.loadAuthor();
            });
            return;
        }
        $scope.loadAuthor();
    }).catch(function(error){
        $scope.showNotFound();
        return;
    });

    $scope.loadAuthor = function(){
        data.getAuthor($scope.post.header.authorHandle).then(function(response){
            $scope.author = response.data;
            $scope.authorLoadSuccess = true;
            $scope.renderPage();
        }).catch(function(){
            $scope.author = new Object;
            $scope.authorLoadSuccess = false;
            $scope.renderPage();
        });
    }

    $scope.renderPage = function(){
        $scope.postHeaderTemplate = theme[$scope.post.header.template];
        $scope.projectCardTemplate = theme[$scope.post.projectCardTemplate];
        $scope.renderHeader();
        $scope.render({
            element: 'main',
            component: theme.main,
            kind: 'page',
            data: $scope.post
        });
        $scope.isRender = false;
    }


});

app.controller('projectCtrl', function(
    $scope,
    widget,
    data,
    theme
    ){

    $scope.getListing = function(){
        data.getIndex("projects").then(function(response){

            $scope.project = response.data;
            $scope.project.listingTemplate = theme[response.data.projectListingTemplate];

            $scope.project.selectedListingRegion = 'mindanao';

            $scope.project.selectListingRegion = function(region){
                if ($scope.project.selectedListingRegion===region) {
                    return true;
                }
                return false;
            }

            $scope.project.setListingRegion = function(param){
                $scope.project.selectedListingRegion = param;
                $scope.setSelectedProjectTab(param);
            }

            $scope.$parent.renderHeader();
            $scope.render({
                element: 'main',
                component: theme.projectPage,
                kind: 'page',
                data: $scope.project
            });
            $scope.$parent.isRender = false;
            return;
        }).catch(function(){
            $scope.$parent.showNotFound();
        });
    }

    $scope.getListing();

    $scope.setSelectedProjectTab = function(project){
        $('.listing-bar-item').removeClass('active-listing-bar-item');
        $('.listing-bar-'+project).addClass('active-listing-bar-item');
        $('.has-selected-region').hide();
    }


    });
