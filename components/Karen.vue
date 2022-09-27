<template>
    <div class="container-fluid p-0 m-0">
        <div class="row mx-0 justify-content-center subheader mb-4 pb-3">
            <div class="banner"></div>
            <div class="col-md-8 subheader--content">
                <div class="karenimg"></div>
                <div class="subheadercontainer pt-2">
                    <h1>Fuck You {{ replacementName }}</h1>
                    <h5>r/FuckYou{{ replacementName }}</h5>
                </div>
            </div>
        </div>
        <div class="row mx-0 justify-content-center">
            <div class="col-md-8" v-if="!started">
                <div class="rcard">
                    <form v-on:submit="onSubmit">
                        <div class="form-group mx-4 my-2">
                            <label for="username-input">Enter your name to feel like a Karen</label>
                            <input
                                type="text"
                                class="form-control"
                                id="username-input"
                                aria-describedby="usernameHelp"
                                placeholder="Your first name"
                                v-model="username"
                            />
                        </div>
                        <button type="submit" class="btn btn-primary mx-4 my-2">Simulate</button>
                    </form>
                </div>
            </div>
            <div class="col-md-8 mb-5" v-if="started">
                <div class v-for="(article, index) in filteredArticles" :key="index">
                    <div class="rcard">
                        <div class="top">
                            <div class="score">{{ abbreviateNumber(article.data.score) }}</div>
                            <div class="title">
                                <small>
                                    Posted by u/{{ article.data.author }}
                                    {{ timeSince(article.data.created) }} ago
                                </small>
                                <h3>{{ replaceTitle(article) }}</h3>
                            </div>
                        </div>

                        <img v-if="isUrlImage(article.data.url)" :src="article.data.url" alt />
                        <img
                            v-if="article.data.is_gallery"
                            :src="mediaUrl(article)"
                            alt
                            v-on:click="cycleGallery(article)"
                        />
                        <div v-if="article.data.is_video">
                            <video
                                :width="article.data.secure_media.reddit_video.width"
                                :height="article.data.secure_media.reddit_video.height"
                                controls
                            >
                                <source
                                    :src="article.data.secure_media.reddit_video.fallback_url"
                                    type="video/mp4"
                                />Your browser does not support the video tag.
                            </video>
                        </div>
                        <div
                            class="selfpost"
                            v-if="article.data.is_self"
                            v-html="getPostHtml(article)"
                        ></div>
                        <a
                            class="comments"
                            target="blank"
                            :href="'https://old.reddit.com' + article.data.permalink"
                            rel="nofollow noopener"
                        >{{ abbreviateNumber(article.data.num_comments) }} Comments</a>
                    </div>
                </div>

                <a
                    class="btn btn-lg d-block btn-primary my-4 mx-auto"
                    v-on:click="loadMore"
                >Load more</a>
            </div>
        </div>
    </div>
</template>

<script>
String.prototype.replaceAll = function (strReplace, strWith) {
    // See http://stackoverflow.com/a/3561711/556609
    var esc = strReplace.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    var reg = new RegExp(esc, "ig");
    return this.replace(reg, strWith);
};

const API = "https://www.reddit.com/r/fuckyoukaren/best.json?limit=25";

export default {
    data() {
        return {
            initialScrapePages: 2,
            username: "",
            started: false,
            articles: [],
            filtered: [],
            scraped: 0,
            after: "",
        };
    },

    mounted() {
        console.log("Component mounted.");

        this.getPage(this.after);

        if (window.location.hash.length > 2) {
            this.started = true;
            this.username = window.location.hash.substr(1);
        }
    },

    computed: {
        filteredArticles() {
            return this.articles.filter(
                (a) => a.data.title.indexOf("Karen") > -1
            );
        },
        replacementName() {
            return this.username.length > 1
                ? this.ucfirst(this.username.replace(/[^\w]/g, ""))
                : "Karen";
        },
    },

    methods: {
        onSubmit(e) {
            e.preventDefault();
            e.stopPropagation();
            this.started = this.username.length > 1;
            window.location.hash = "#" + this.username;
        },

        cycleGallery(article) {
            article.data.mediai++;
            this.$forceUpdate();
        },

        replaceAll(str, find, replace) {
            var escapedFind = find.replace(
                /([.*+?^=!:${}()|\[\]\/\\])/g,
                "\\$1"
            );
            return str.replace(new RegExp(escapedFind, "g"), replace);
        },

        replaceTitle(article) {
            const replace = this.ucfirst(this.username.replace(/[^\w]/g, ""));
            let str = article.data.title.replaceAll("karen", replace);
            return str;
        },
        mediaUrl(article) {
            if (typeof article.data.mediai === "number") {
                // article.data.mediai++;
            } else {
                article.data.mediai = 0;
            }

            const keys = Object.keys(article.data.media_metadata);
            const key = keys[article.data.mediai % keys.length];
            return decodeURIComponent(
                article.data.media_metadata[key].s.u.replace(/&amp;/g, "&")
            );
        },

        ucfirst(str) {
            return str[0].toUpperCase() + str.slice(1);
        },

        getPostHtml(post) {
            var txt = document.createElement("textarea");
            txt.innerHTML = post.data.selftext_html;

            const replace = this.ucfirst(this.username.replace(/[^\w]/g, ""));
            let str = txt.value.replaceAll("karen", replace);
            return str;
        },

        getPage(after = "") {
            const url = after.length > 1 ? API + "&after=" + after : API;
            fetch(url)
                .then((r) => r.json())
                .then((response) => {
                    console.log(response);
                    console.log(
                        response.data.children.filter(
                            (obj) => obj.data.is_video
                        )
                    );

                    for (let d of response.data.children) {
                        if (d.data.is_gallery) {
                            console.log(d.data.preview);
                        }
                    }

                    this.after = response.data.after;
                    this.articles.push(...response.data.children);

                    this.scraped++;
                    if (this.scraped < this.initialScrapePages) {
                        this.getPage(this.after);
                    }
                });
        },

        loadMore() {
            this.getPage(this.after);
        },

        abbreviateNumber(value) {
            var newValue = value;
            if (value >= 1000) {
                var suffixes = ["", "k", "m", "b", "t"];
                var suffixNum = Math.floor(("" + value).length / 3);
                var shortValue = "";
                for (var precision = 2; precision >= 1; precision--) {
                    shortValue = parseFloat(
                        (suffixNum != 0
                            ? value / Math.pow(1000, suffixNum)
                            : value
                        ).toPrecision(precision)
                    );
                    var dotLessShortValue = (shortValue + "").replace(
                        /[^a-zA-Z 0-9]+/g,
                        ""
                    );
                    if (dotLessShortValue.length <= 2) {
                        break;
                    }
                }
                if (shortValue % 1 != 0) shortValue = shortValue.toFixed(1);
                newValue = shortValue + suffixes[suffixNum];
            }
            return newValue;
        },

        timeSince(date) {
            var seconds = Math.floor((new Date() - date * 1000) / 1000);

            var interval = seconds / 31536000;

            if (interval > 1) {
                return (
                    Math.floor(interval) + " year" + (interval > 2 ? "s" : "")
                );
            }
            interval = seconds / 2592000;
            if (interval > 1) {
                return (
                    Math.floor(interval) + " month" + (interval > 2 ? "s" : "")
                );
            }
            interval = seconds / 86400;
            if (interval > 1) {
                return (
                    Math.floor(interval) + " day" + (interval > 2 ? "s" : "")
                );
            }
            interval = seconds / 3600;
            if (interval > 1) {
                return (
                    Math.floor(interval) + " hour" + (interval > 2 ? "s" : "")
                );
            }
            interval = seconds / 60;
            if (interval > 1) {
                return (
                    Math.floor(interval) + " minute" + (interval > 2 ? "s" : "")
                );
            }
            return Math.floor(seconds) + " second" + (interval > 2 ? "s" : "");
        },

        isUrlImage(url) {
            return (
                [".jpg", ".png", ".gif"].indexOf(url.substr(-4).toLowerCase()) >
                -1
            );
        },
    },
};
</script>
