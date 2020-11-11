function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
};

function createElementFromHTML(htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();
  
    // Change this to div.childNodes to support multiple top-level nodes
    return div.firstChild; 
}


var replacer = {
    tags: function(input, tagName){
        return input.replace("${tag.name}", tagName).replace("${tag.url}", "/tag.html?tag="+tagName);
    },

    post: function(input, post, id){
        return input
            .replace("${post.title}", post.title)
            .replace("${post.description}", post.description)
            .replace('${post.url}', "/post.html?id="+id)
            .replace("${post.cover}", gitblog.getImageUrl(post.cover))
            .replace('${post.tag}', post.tags.length > 0 ? post.tags[0] : "")
            .replace('${post.date}', this.formatDate(post.date));
    },

    user: function(input, user){
        return input.replace("${user.title}", user.title).replace("${user.bio}", user.bio).replace('${user.url}', "/user.html?username="+user.username).replace("${user.name}", user.name).replace('${user.profilePicture}', gitblog.getImageUrl(user.profilePicture));
    },

    formatDate: function(date) {
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();
    
        if (month.length < 2) 
            month = '0' + month;
        if (day.length < 2) 
            day = '0' + day;
    
        return [year, month, day].join('/');
    }
}

$(function() {
    gitblog.getIndex().done(function(index){
        //load head tags from index
        fixHeadTags(index);
        fixPosts(index);
        fixUsers(index);
    });

    function fixUsers(index){
        $('[data-gb="users"]').each(function(i, obj){
            var cloneObject = $(obj).clone();
            var sinfo = getSlice(cloneObject);
            var parent = $(obj).parent();
            $(obj).remove();
            var usernames = index.usernames.slice(sinfo.start, sinfo.count);

            usernames.forEach(username => {
                gitblog.getUser(username).done(function(user){
                    var objAsText = replacer.user(cloneObject.prop('outerHTML'), user);
                    var newUser = $(createElementFromHTML(objAsText));
                    parent.append(newUser);
                    cloneObject.remove();
                });
            });

        });
        
    }

    function fixPosts(index){
        $('[data-gb="posts"]').each(function(i, obj){
            var cloneObject = $(obj).clone();
            var parent = $(obj).parent();
            $(obj).remove();

            var sinfo = getSlice(cloneObject);
            console.log(sinfo);
            var postIds = index.posts.slice(sinfo.start, sinfo.count);
            console.log(postIds);
            postIds.forEach(postId => {
                gitblog.getPost(postId).done(function(post){
                    var objAsText = replacer.post(cloneObject.prop('outerHTML'), post, postId);
                    var newPost = $(createElementFromHTML(objAsText));
                    parent.append(newPost);
                })
            });
            cloneObject.remove();
            
        })
    }
    
    function fixHeadTags(index){
        $('[data-gb="tags"]').each(function(i, obj){
            var cloneObject = $(obj).clone();
            var parent = $(obj).parent();
            $(obj).remove();
            var activeTag = getUrlParameter("tag");
            
            index.tags.forEach(tag => {
                var objAsText = replacer.tags(cloneObject.prop('outerHTML'), tag);
                var newTag = $(createElementFromHTML(objAsText));
                var classToAdd = undefined;
                if(tag === activeTag){
                    classToAdd = cloneObject.attr("data-gb-active");
                }else{
                    classToAdd = cloneObject.attr("data-gb-inactive");
                }

                if(classToAdd !== undefined && classToAdd !== ""){
                    newTag.addClass(classToAdd);
                }

                parent.append(newTag);
                cloneObject.remove();
            })
            
        })
    }
    

    function getSlice(obj){
        var sliceStart = obj.data("gb-slice-start") !== undefined ? obj.data("gb-slice-start") : -10;
        var sliceCount = obj.data("gb-slice-count") !== undefined ? obj.data("gb-slice-count") : 10;

        return {"start": sliceStart, "count": sliceCount};
    }
});

