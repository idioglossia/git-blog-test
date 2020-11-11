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
        return input.replace("${post.title}", post.title).replace("${post.description}", post.description).replace('${post.url}', "/post.html?id="+id).replace("${post.cover}", gitblog.getImageUrl(post.cover));
    }
}

$(function() {
    gitblog.getIndex().done(function(index){
        //load head tags from index
        fixHeadTags(index);
        fixNewestPost(index);
    });

    function fixNewestPost(index){
        lastPostId = index.posts[index.posts.length - 1];
        gitblog.getPost(lastPostId).done(function(post){
            $('[data-gb="post-newest"]').each(function(i, obj){
                var cloneObject = $(obj).clone();
                var parent = $(obj).parent();
                $(obj).remove();
                var objAsText = replacer.post(cloneObject.prop('outerHTML'), post, lastPostId);
                var newPost = $(createElementFromHTML(objAsText));
                parent.append(newPost);
                cloneObject.remove();
            })
        }).fail(function(){
            $('[data-gb="post-newest"]').hide();
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
    
});

