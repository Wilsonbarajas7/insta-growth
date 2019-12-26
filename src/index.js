const _ = require('lodash')
require('tools-for-instagram');

/*
    TODO: Avoid selfcomments of original poster, in sorting
*/

async function getCleanFeed(ig,hashtags) {
    return new Promise(async(resolve, reject) => {
        //Loping all hashtags, and saving it
        let allPosts = await Promise.all(hashtags.map(async (hashtag) => {
            let postsInFoodHashtags = await recentHashtagList(ig, hashtag)
            return postsInFoodHashtags;
        }))

        //Just collecting the info what we want and packing in a new object
        let cleanFeed = await allPosts.map((feed) => {
            let cleaningFeed = feed.map((objFeed) => {
                let objClean = {
                    taken_at: objFeed.taken_at,
                    media_type: objFeed.media_type,
                    pk: objFeed.pk,
                    id: objFeed.id,
                    code: objFeed.code,
                    user: objFeed.user,
                    caption: objFeed.caption,
                    comment_count: objFeed.comment_count,
                    like_count: objFeed.like_count,
                    has_liked: objFeed.has_liked,
                }
                return objClean
            });
            return cleaningFeed
        });
        resolve(_.flatten(cleanFeed));
    });
}

function sortingByCountLikesAndPosts(maxCountComments,maxCountLikes,getVideos,feed){
    let sortingByCountLikes = feed.filter((post) =>{
        if(post.like_count <= maxCountLikes){
            if(!getVideos && post.media_type == 1){ //If is video and if we are collecting them
                return post
            }else if (getVideos){
                return post
            }
        }
    })

    let sortingByCountComments = feed.filter((post) =>{
        if(post.comment_count <= maxCountComments){
            if(!getVideos && post.media_type == 1){ //If is video and if we are collecting them
                return post
            }else if (getVideos){
                return post
            }
        }
    })

    console.log(`La limpieza por el maximo de likes ha dejado un total de ${sortingByCountLikes.length} posts`)
    console.log(`La limpieza por el maximo de comments ha dejado un total de ${sortingByCountComments.length} posts`)

    let bothSortedLists = [sortingByCountLikes,sortingByCountComments]
    bothSortedLists = _.flatten(bothSortedLists)
    bothSortedLists = _.uniq(bothSortedLists)

    //console.log(bothSortedLists)
    return bothSortedLists
}



async function sortByUserInfo(ig,feed){
    let allUsers = []

    for(let i = 0; i < feed.length; i++){
        let inforAboutUser = await getUserInfo(ig,feed[i].user.username)
        console.log(inforAboutUser)
        allUsers.push(inforAboutUser)
        await sleep(3)
    }
}


(async () => {
    //Loading our config && login
    const config = require('./config.json')
    let ig = await login();

    //geting hashtags posts
    
    let feed = await getCleanFeed(ig,config.hashtags);
    console.log(`Feed OK. ${feed.length} posts found in ${config.hashtags.length} hastags`)
    console.log(`Sorting feed.`)
    let sortedByPopularity = sortingByCountLikesAndPosts(2,9,false,feed) //Check varibale name
    sortByUserInfo(ig,sortedByPopularity)


})();
//2219002582