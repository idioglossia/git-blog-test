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

//makes element from html string
function createElementFromHTML(htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstChild; 
}

//replaces content of elements with proper values from user, post, tag
var replacer = {
    tags: function(input, tagName){
        return input.replace("${tag.name}", tagName.replace('-', ' ')).replace("${tag.url}", "tag.html?tag="+tagName);
    },

    post: function(input, post, id){
        return input
            .replace("${post.title}", post.title)
            .replace("${post.content}", post.content)
            .replace("${post.description}", post.description)
            .replace("${post.username}", post.username)
            .replace('${post.url}', "post.html?id="+id)
            .replace("${post.cover}", gitblog.getImageUrl(post.cover))
            .replace("${post.thumbnail}", post.thumbnail != null ? gitblog.getImageUrl(post.thumbnail) : "")
            .replace('${post.tag}', post.tags.length > 0 ? post.tags[0] : "")
            .replace('${post.date}', this.formatDate(post.date));
    },

    postCover: function(input, post){
        return input.replace("${post.cover}", gitblog.getImageUrl(post.cover));
    },

    user: function(input, user){
        return input.replace("${user.title}", user.title).replace("${user.bio}", user.bio).replace('${user.url}', "user.html?username="+user.username).replace("${user.name}", user.name).replace('${user.profilePicture}', gitblog.getImageUrl(user.profilePicture));
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
        fixUserProfile();
    });

    //fixes a user profile content
    function fixUserProfile(){
        var username = getUrlParameter("username");
        if(username !== undefined){
            gitblog.getUser(username).done(function(user){
                $('[data-gb="user"]').each(function(i, obj){
                    var cloneObject = $(obj).clone();
                    var parent = $(obj).parent();
                    $(obj).remove();
                    var objAsText = replacer.user(cloneObject.prop('outerHTML'), user);
                    var newUser = $(createElementFromHTML(objAsText));
                    parent.append(newUser);
                    cloneObject.remove();

                });

                $('[data-gb="user-posts"]').each(function(i, obj){
                    var size = $(obj).data("gb-size-per-page");
                    var page = getUrlParameter("page");
                    console.log(page);
                    console.log(size);
                    if(page === undefined){
                        page = 0;
                    }else{
                        page = parseInt(page);
                    }

                    postIds = cleanSlice(user.postIds, page * size, ((page + 1) * size));
                    console.log(postIds);
                    writePosts(obj, postIds);
                    $(obj).remove();

                    fixPagination(user.postIds.length, size, "username="+username);
                });
            });
        }
    }

    function fixPagination(size, sizePerPage, query){
        if(size < sizePerPage)
            return;

        var pagination = $('[data-gb="pagination"]')[0];
        var older = $($(pagination).find('[data-gb-pg="older"]')[0]);
        var newer = $($(pagination).find('[data-gb-pg="newer"]')[0]);
        var page = getUrlParameter("page");
        
        if(page === undefined){
            page = 0;
        }else{
            page = parseInt(page);
        }

        if(page > 0){
            older.attr("href", "?page=" + (page - 1) + ((query !== null || query !== undefined) ? '&' + query : ''));
        }else{
            older.addClass(older.attr("data-gb-pg-inactive"));
        }

        if(((page + 1) * sizePerPage) < size){
            newer.attr("href", "?page=" + (page + 1) + ((query !== null || query !== undefined) ? '&' + query : ''));
        }else{
            newer.addClass(newer.attr("data-gb-pg-inactive"));
        }
    }

   

    //fixes a post page: content, cover, user, related posts
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
                fixRelatedPosts(post, postId);
            });
        }
    }

    //fixes users based on index
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

    //fixes posts related to a post id
    //does it for maximum 4 new posts in tags
    function fixRelatedPosts(post, postId){
        var ignore = new Set([postId]);
        var i = 0;
        var obj = $('[data-gb="posts-related"]')[0];
        var cloneObject = $(obj).clone();
        var parent = $(obj).parent();
        post.tags.forEach(tag => {
            gitblog.getTag(tag).done(function(tag){
                tag.postIds.slice(0, 5).forEach(function(pid){
                    if(postId != pid && i < 4 && !ignore.has(pid)){
                        console.log(pid + " is related to " + postId)                        
                        writePostIntoParent(cloneObject, pid, parent);
                        i++;
                        ignore.add(pid);
                    }
                });
            })
        });
        cloneObject.remove();
        obj.remove();
    }

    //fixes list of posts using index
    function fixPosts(index){
        $('[data-gb="posts"]').each(function(i, obj){
            var postIds = sliceArr(obj, index.posts);
            writePosts(obj, postIds);
            $(obj).remove();
        });
    }
    
    //fixes tags in head of the page
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
    
    //slices an array based on slice information of an element
    function sliceArr(obj, arr){
        var sliceObj = getSliceObj(obj);
        if(sliceObj.end === undefined)
            return arr.slice(sliceObj.start);
        else
            return arr.slice(sliceObj.start, sliceObj.end);
    }

    //returns slice information of an element
    function getSliceObj(obj){
        obj = $(obj);
        var sliceStart = obj.data("gb-slice-start") !== undefined ? obj.data("gb-slice-start") : -10;
        var sliceEnd = obj.data("gb-slice-end");

        return {"start": sliceStart, "end": sliceEnd};
    }

    //writes arrays of posts into a parent
    function writePosts(obj,arr){
        var cloneObject = $(obj).clone();
        var parent = $(obj).parent();
        arr.forEach(postId => {
            writePostIntoParent(cloneObject, postId, parent);
        });
        cloneObject.remove();
    }

    //writes a post obj into its parent
    function writePostIntoParent(cloneObject, postId, parent){
        gitblog.getPost(postId).done(function(post){
            var objAsText = replacer.post(cloneObject.prop('outerHTML'), post, postId);
            var newPost = $(createElementFromHTML(objAsText));
            parent.append(newPost);
        });
    }

    function cleanSlice(arr, f, t){
        var res = [];
        for(i = f; i < t; i++){
            res[res.length] = arr[i];
        }

        return res;
    }

});

