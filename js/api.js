var gitblog = {
    dbPath: 'db',

    setDbPath: function(path){
        this.dbPath = path;
    },

    getImageUrl: function(id){
        return this.dbPath + '/images/' + id;
    },

    getIndex: function(){
        return $.ajax({
            url: this.dbPath + '/index/index.json',
            type: 'GET',
            data: 'json',
            cache: true
        }); 
    },

    getTag: function(tagName){
        return $.ajax({
            url: this.dbPath + '/tags/' + tagName + '.json',
            type: 'GET',
            data: 'json'
        });
    },

    getPost: function(id){
        return $.ajax({
            url: this.dbPath + '/posts/' + id + '.json',
            type: 'GET',
            data: 'json'
        });
    },

    getUser: function(username){
        return $.ajax({
            url: this.dbPath + '/users/' + username + '.json',
            type: 'GET',
            data: 'json'
        });
    }
}
