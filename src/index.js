const config = require('./config.json');
require('tools-for-instagram');
const _ = require('lodash');
const utilSave = require('./saveToJson');
let socket = require('socket.io-client')('http://localhost:5000/');
let commentsToPerfom = []

/*
    WARN: Actual limit is 180 request x min
    TODO: Avoid selfcomments of original poster, in sorting
*/

socket.on("connect", () => {
    console.log('Bot WORKING');
});

socket.on('addNewPost', function(data){
    commentsToPerfom.push(data)
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

    console.log(`La limpieza por el maximo de likes ha dejado un total de ${sortingByCountLikes.length} posts`)
    console.log(`La limpieza por el maximo de comments ha dejado un total de ${sortingByCountComments.length} posts`)

    let bothSortedLists = [sortingByCountLikes, sortingByCountComments]
    bothSortedLists = _.flatten(bothSortedLists)
    bothSortedLists = _.uniq(bothSortedLists)

    return bothSortedLists
}


function checkWaitingActions(){
    if(commentsToPerfom.length != 0){

    }
}


async function sortByUserInfo(ig, feed) {
    return new Promise(async (resolve, reject) => {
        let usersFiltered = []

        console.log(`El numero de perfiles que se van a analizar es de : ${feed.length}`)
        for (let i = 0; i < /*feed.length*/50; i++) {
            checkWaitingActions()
            //console.log(dataR.length)

            try {
                let infoAboutUser = await getUserInfo(ig, feed[i].user.username)
                if (infoAboutUser.follower_count <= config.maxFollows && infoAboutUser.media_count <= config.maxMediaCount && !infoAboutUser.is_verified) {
                    let urlPhoto = await getPhotoUrl(ig, feed[i].id)
                    
                    let objectInfo = {
                        "userInfo" : infoAboutUser,
                        "ownFeed" : feed[i],
                        "photoUrl" : urlPhoto
                    }

                    socket.emit('addNewPost', objectInfo);
                    usersFiltered.push(objectInfo)
                }
                await sleep(3)


            } catch (error) {
                console.log(error)
            }
        }

        /*
        let sortingUsers = allUsers.filter((user) => {
            if (user.follower_count <= config.maxFollows && user.media_count <= config.maxMediaCount && !user.is_verified) {
                return user
            }
        })


        
        let usersWithTheirFeed = await Promise.all(sortingUsers.map(async (sortedUsers, index) => {
            let ownFeed = feed.filter(async (feedExport) => {
                if (feedExport.user.username == sortedUsers.username) {
                    return feedExport;
                }
            });

            console.log('-------------------')
            console.log("username: " + sortedUsers.username)
            console.log("isPrivate: " + sortedUsers.is_private)
            console.log("isVerified: " + sortedUsers.is_verified)
            console.log("followerCount: " + sortedUsers.follower_count)
            console.log("followingCount: " + sortedUsers.following_count)
            console.log("photoCode: " + ownFeed[index].code)
            console.log('-------------------')
    

            let actualOwnFeed = _.find(ownFeed, function(o) {
                if(sortedUsers.username == o.user.username){
                    return true;
                }
            });
            
            
            let urlPhoto = await getPhotoUrl(ig, actualOwnFeed.id)

   
            console.log('socket emitedd')

            return {
                "userInfo" : sortedUsers,
                "ownFeed" : actualOwnFeed,
                "photoUrl" : urlPhoto
            }
        }))
        */
        resolve(usersFiltered)
    })
}

function getRatioFollowingFollowedAccounts(following_count, follower_count) {
    return following_count / follower_count
}

(async () => {
    //Loading our config && login
    const config = require('./config.json')
    let ig = await login();

    //geting hashtags posts
    let feed = await getCleanFeed(ig, config.hashtags);
    console.log(`Feed OK. ${feed.length} posts found in ${config.hashtags.length} hastags`)
    console.log(`Sorting feed.`)

    let sortedByPopularity = sortingByCountLikesAndPosts(2, 20, false, feed) //Check varibale name
    //console.log(`La criba basada en maxComments y MaxLikes es de ${sortedByPopularity.length}`)

    //let DEVsortedByPopularity = _.take(sortedByPopularity, 5)
    let sortedByInfoUser = await sortByUserInfo(ig,sortedByPopularity)// sortByUserInfo(ig,sortedByPopularity)
    utilSave.saveVarToJson(sortedByInfoUser)
    

    console.log("SESSION END")
})();

