const config = require('./config.json');
require('tools-for-instagram');
const _ = require('lodash');
const utilSave = require('./saveToJson');


/*
    WARN: Actual limit is 180 request x min
    TODO: Avoid selfcomments of original poster, in sorting
*/

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


async function sortByUserInfo(ig, feed) {
    return new Promise(async (resolve, reject) => {
        let allUsers = []

        console.log(`El numero de perfiles que se van a analizar es de : ${feed.length}`)
        for (let i = 0; i < feed.length; i++) {
            let inforAboutUser = await getUserInfo(ig, feed[i].user.username)
            allUsers.push(inforAboutUser)
            await sleep(3)
        }

        console.log(`La lista antes de la criba se ha quedado en: ${allUsers.length}`)

        let sortingUsers = allUsers.filter((user) => {
            if (user.follower_count <= config.maxFollows && user.media_count <= config.maxMediaCount && !user.is_verified) {
                return user
            }
        })

        let usersWithTheirFeed = sortingUsers.map((sortedUsers) => {
            let ownFeed = feed.filter((feedExport) => {
                if (feedExport.user.username == sortedUsers.username) {
                    return feedExport;
                }
            })

            return {
                "userInfo" : sortedUsers,
                "ownFeed" : ownFeed[0]
            }
        })
        resolve(usersWithTheirFeed)
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

    let sortedByPopularity = sortingByCountLikesAndPosts(1, 2, false, feed) //Check varibale name
    //console.log(`La criba basada en maxComments y MaxLikes es de ${sortedByPopularity.length}`)

    let DEVsortedByPopularity = _.take(sortedByPopularity, 5)
    let sortedByInfoUser = await sortByUserInfo(ig, sortedByPopularity)// sortByUserInfo(ig,sortedByPopularity)
    utilSave.saveVarToJson(sortedByInfoUser)
    console.log(sortedByInfoUser[0].ownFeed);



})();

/*

-username
-is_private
-is_verified*
-media_count*
-geo_media_count
-follower_count*
-following_count*
-following_tag_count
-is_interest_account????????
-is_business
-account_type

*/