const config = require('./config.json');
require('tools-for-instagram');
const _ = require('lodash');
const utilSave = require('./saveToJson');
let socket = require('socket.io-client')('http://localhost:5000/');


//"hashtags" : ["recipe","foodies","cooking","food","foodporn","yumyum","foodphotography","foodpics","delicious"],

socket.on("connect", () => {
    console.log('Bot WORKING');
});



async function getCleanFeed(ig, hashtags) {
    return new Promise(async (resolve, reject) => {
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

function sortingByCountLikesAndPosts(maxCountComments, maxCountLikes, getVideos, feed) {
    let sortingByCountLikes = feed.filter((post) => {
        if (post.like_count <= maxCountLikes) {
            if (!getVideos && post.media_type == 1) { //If is video and if we are collecting them
                return post
            } else if (getVideos) {
                return post
            }
        }
    })

    let sortingByCountComments = feed.filter((post) => {
        if (post.comment_count <= maxCountComments) {
            if (!getVideos && post.media_type == 1) { //If is video and if we are collecting them
                return post
            } else if (getVideos) {
                return post
            }
        }
    })

    let bothSortedLists = [sortingByCountLikes, sortingByCountComments]
    bothSortedLists = _.flatten(bothSortedLists)
    bothSortedLists = _.uniq(bothSortedLists)

    return bothSortedLists
}

async function sortByUserInfo(ig, feed) {
    return new Promise(async (resolve, reject) => {
        let usersFiltered = []

        for (let i = 0; i < feed.length; i++) {
            try {
                let infoAboutUser = await getUserInfo(ig, feed[i].user.username)

                //console.log(infoAboutUser)
                if (infoAboutUser.follower_count <= config.maxFollows && infoAboutUser.media_count <= config.maxMediaCount && !infoAboutUser.is_verified) {
                    let urlPhoto = await getPhotoUrl(ig, feed[i].id)
                    
                    console.log(infoAboutUser.username)

                    let objectInfo = {
                        "userInfo" : infoAboutUser,
                        "ownFeed" : feed[i],
                        "photoUrl" : urlPhoto
                    }

                    socket.emit('addNewPost', objectInfo);
                    usersFiltered.push(objectInfo)
                }
                await sleep(15)
            } catch (error) {
                console.log(error)
            }
        }
        resolve(usersFiltered)
    });
}

function getRatioFollowingFollowedAccounts(following_count, follower_count) {
    return following_count / follower_count
}

(async () => {
    const config = require('./config.json')
    let ig = await login();

    socket.on('postComment', function(data){
        console.log(data);
        commentMediaId(ig, data.media_id, data.commentContent)
    });

    socket.on('giveLike', function(data){
        console.log(data)
        likeMediaId(ig, data.media_id)  
    });

    let feed = await getCleanFeed(ig, config.hashtags);
    console.log(`Feed Loaded!.\n${feed.length} posts found in ${config.hashtags.length} hastags`)
    console.log(feed)

    let sortedByPopularity = sortingByCountLikesAndPosts(2, 20, false, feed) //Check varibale name
    console.log(`Sorted by maxLikes and maxComments: ${sortedByPopularity.length} profiles`);

    let sortedByInfoUser = await sortByUserInfo(ig,sortedByPopularity)// sortByUserInfo(ig,sortedByPopularity)
    console.log(`Sorted by uploaded maxFollows, maxMediaCount and verfiedProfile: ${sortedByInfoUser.length} profiles`)
    utilSave.saveVarToJson(sortedByInfoUser)

    console.log("SESSION END")
})();

