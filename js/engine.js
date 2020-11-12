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
        return input.replace("${tag.name}", tagName.replace('-', ' ')).replace("${tag.url}", "/tag.html?tag="+tagName);
    },

    post: function(input, post, id){
        return input
            .replace("${post.title}", post.title)
            .replace("${post.content}", post.content)
            .replace("${post.description}", post.description)
            .replace("${post.username}", post.username)
            .replace('${post.url}', "/post.html?id="+id)
            .replace("${post.cover}", gitblog.getImageUrl(post.cover))
            .replace("${post.thumbnail}", post.thumbnail != null ? gitblog.getImageUrl(post.thumbnail) : "")
            .replace('${post.tag}', post.tags.length > 0 ? post.tags[0] : "")
            .replace('${post.date}', this.formatDate(post.date));
    },

    postCover: function(input, post){
        return input.replace("${post.cover}", gitblog.getImageUrl(post.cover));
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
        fixPagePost();
    });

    function fixPagePost(){
        var postId = getUrlParameter("id");
        if(postId !== undefined){
            gitblog.getPost(postId).done(function(post){
                $('[data-gb="post"]').each(function(i, obj){
                    var cloneObject = $(obj).clone();
                    var parent = $(obj).parent();
                    $(obj).remove();
                    var objAsText = replacer.post(cloneObject.prop('outerHTML'), post, postId);
                    var newPost = $(createElementFromHTML(objAsText));
                    parent.append(newPost);
                });
                $('[data-gb="post-cover"]').each(function(i,obj){
                    var cloneObject = $(obj).clone();
                    var parent = $(obj).parent();
                    $(obj).remove();
                    var objAsText = replacer.postCover(cloneObject.prop('outerHTML'), post);
                    var newPostCover = $(createElementFromHTML(objAsText));
                    parent.append(newPostCover);
                });
                $('[data-gb="post-user"]').each(function(i, obj){
                    gitblog.getUser(post.username).done(function(user){
                        var cloneObject = $(obj).clone();
                        var parent = $(obj).parent();
                        $(obj).remove();
                        var objAsText = replacer.user(cloneObject.prop('outerHTML'), user);
                        var newUser = $(createElementFromHTML(objAsText));
                        parent.append(newUser);
                    });
                    
                });
            });
        }
    }

    function fixUsers(index){
        $('[data-gb="users"]').each(function(i, obj){
            var cloneObject = $(obj).clone();
            var parent = $(obj).parent();
            $(obj).remove();
            var usernames = sliceArr(cloneObject, index.usernames);

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

            var postIds = sliceArr(cloneObject, index.posts);
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
    
    function sliceArr(obj, arr){
        var sliceObj = getSliceObj(obj);
        if(sliceObj.end === undefined)
            return arr.slice(sliceObj.start);
        else
            return arr.slice(sliceObj.start, sliceObj.end);
    }

    function getSliceObj(obj){
        var sliceStart = obj.data("gb-slice-start") !== undefined ? obj.data("gb-slice-start") : -10;
        var sliceEnd = obj.data("gb-slice-end");

        return {"start": sliceStart, "end": sliceEnd};
    }
});

