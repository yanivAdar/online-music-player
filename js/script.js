$(document).ready(() => {
    const g_AllPlaylistObjArray = {};
    const init = () => {
        ajaxRequest('get', '', (data) => {
            initAppend(data);
        })
    }

    const ajaxRequest = (method, path, cb, dataToSend) => {
        $.ajax({
            url: 'api/playlist' + path,
            contentType: "application/x-www-form-urlencoded",
            type: method,
            success: (data) => {
                return cb(data.data);
            },
            error: (err) => {
                console.log(err);
            },
            data: dataToSend
        });
    };

    const initAppend = (dataObjArr) => {
        $('.main-playlist').empty();
        dataObjArr.forEach((x) => {
            g_AllPlaylistObjArray[x.id] = { id: x.id, name: x.name, image: x.image };
            ajaxRequest('get', '/' + x.id + '/songs', data => g_AllPlaylistObjArray[x.id].songs = data.songs);
            appending(x);
        })
        playJuckBox();
        removeEdit();
    }

    const appending = (x) => {
        $('.main-playlist').append(`<div id="playlistDiv` + x.id + `" class="col-lg-3 col-md-3 col-sm-3 col-xs-3 single-playlist">
                                        <h2 value="`+ x.name + `" id="playlistTitle` + x.id + `" class="headLine">` + x.name + `</h2>
                                        <span class="white-circle">
                                            <span class="glyphicon glyphicon-play toggle-show"></span>
                                        </span>
                                        <span class="pos-glyphs">
                                            <span class="glyphicon glyphicon-pencil small-circle editPlay"></span>
                                            <span class="glyphicon glyphicon-remove small-circle removePlay" data-toggle="modal" data-target="#myAreYouSureModal"></span>
                                        </span>
                                    </div>`
        )
        $('#playlistDiv' + x.id).css('background-image', 'url(' + x.image + ')')
        let roundedText = new CircleType($('#playlistTitle' + x.id)[0]);
        roundedText.radius(130);
    }

    $('#addSong').click(() => appendModalSongsList('', ''));
    const appendModalSongsList = (url, name) => {
        $('#playlistSongList').append(` <tr class="ToBeRemoved">
                                                <td><label for="songUrl">Song URL</label></td>
                                                <td><input type="text" class="form-control songUrl" value="`+ url + `"/></td/>
                                                <td><label for="songUrl">Name</label></td>
                                                <td><input type="text" class="form-control songName" value="`+ name + `"/></td>
                                            </tr>`);
    }

    $('#newPlaylist').click(() => {
        $('.ToBeRemoved').remove()
        for (let i = 0; i < 3; i++) {
            appendModalSongsList('', '');
        }
        $('#plyName').val('');
        $('#plyUrl').val('');
        createOrUpdatePlaylist(null, (data) => g_AllPlaylistObjArray[data.id] = data)
    });

    const playJuckBox = () => {
        $('.white-circle').click(function (e) {
            let id = $(this).siblings('h2')[0].id;
            appendJukeBox(id);
            $('.main-playlist').css('margin-top', '340px');
            $('.jukeBox').css('margin-top', '80px');
        });
    }

    const play = () => {
        let current = 0;
        let player = $('#audio')[0];
        let playlist = $('#songsList');
        let playlistLength = playlist.find('li').length - 1;
        let link = playlist.find('a')[0];
        playSong($(link), player);
        player.onpause = () => {
            $('#playlistImage').removeClass('spinPlay');
        }
        player.onplay = () => {
            $('#playlistImage').addClass('spinPlay');
        }
        playlist.click(e => {
            e.preventDefault();
            link = $(e.target);
            current = link.parent().index();
            playSong(link, player);
        });
        $(player).on('ended', e => {
            current++;
            if (current == playlistLength) {
                current = 0;
                link = playlist.find('a')[0];
            } else {
                link = playlist.find('a')[current];
            }
            playSong($(link), player);
        });
    }

    const playSong = (link, player) => {
        player.src = link.attr('href');
        player.load();
        player.play();
        par = link.parent();
        par.addClass('active').siblings().removeClass('active');
    }

    const appendJukeBox = (id) => {
        let idNum = id.replace(/^\D+/g, '');
        let imgUrl = $('#playlistDiv' + idNum)[0].style.backgroundImage;
        let path = '/' + idNum + '/songs';
        $('#playingNow').html($('#' + id)[0].innerText);
        $('#playlistImage').css('opacity', '1');
        $('#playlistImage').css('background-image', imgUrl);
        $('#songsList').empty();
        ajaxRequest('get', path, data => {
            data['songs'].length < 5 ? $('#songsList').css('overflow', 'hidden') : $('#songsList').css('overflow', 'scroll');
            data['songs'].forEach(x => $('#songsList').append(`<li>
                                                                    <a href="`+ x.url + `">
                                                                        `+ x.name + `
                                                                    </a> 
                                                                </li>`));
            play();
        })
    }

    const emptyInputs = () => {
        $('.reset').click(() => {
            $('#plyUrl').val('');
            $('#plyName').val('');
        })
    }

    const removeEdit = () => {
        $('.small-circle').off('click');
        $('.small-circle').click(e => {
            const id = $(e.target).parents('div')[0].id.replace(/^\D+/g, '');
            if ($(e.target).hasClass('removePlay')) {
                $('#deletePlaylist').html(g_AllPlaylistObjArray[id].name);
                $('#delete').off('click');
                $('#delete').click(() => {
                    return ajaxRequest('delete', '/' + id, () => $('#playlistDiv' + id).remove());
                });
            }
            if ($(e.target).hasClass('editPlay')) {
                $(e.target).attr('data-target', "#myModal").attr('data-toggle', "modal");
                appendModal(id);
                createOrUpdatePlaylist(id);
            }
        })
    }

    const appendModal = (id) => {
        let myImgUrl = g_AllPlaylistObjArray[id].image;
        $('.ToBeRemoved').remove();
        $('#plyName').val(g_AllPlaylistObjArray[id].name);
        myImgUrl ? $('#plyUrl').val(myImgUrl) : $('#plyUrl').val('Media/Pictures/a37b37d99e7cef805f354d47.noimage_thumbnail.png')
        $('#plyUrl').val(myImgUrl);
        g_AllPlaylistObjArray[id].songs.forEach((x) => {
            appendModalSongsList(x.url, x.name);
        })
        emptyInputs();        
    }

    //---------clicking anywhere to make the Jukebox disappear
    $(document).click(e => {
        if ($(e.target).is(document.children[0])) {
            $('.jukeBox').css('margin-top', '-340px');
            $('.main-playlist').css('margin-top', '0px');
            $('#playlistImage').removeClass('.spinPlay');
            $('audio')[0].pause();
        }
    })

    const makeSongsArr = (arr1, arr2) => {
        let objArr = [];
        for (let i = 0; i < arr1.length; i++) {
            let tempObj = {};
            if (arr1[i]['value'] !== '' && arr1[i]['value'] !== '') {
                tempObj["name"] = arr2[i]['value'];
                tempObj["url"] = arr1[i]['value'];
                objArr.push(tempObj);
            }
        }
        return objArr
    }

    const putImgInDisplay = () => {
        $('.PlaylistPic').attr('src', $('#plyUrl').val());
        $("#plyUrl").off("keyup");
        $('#plyUrl').keyup(() => $('.PlaylistPic').attr('src', $('#plyUrl').val()));
    }

    const createOrUpdatePlaylist = (id, cb) => {
        putImgInDisplay();
        $("#nextModal").off("click");
        $('#nextModal').click(() => {
            let dataObj = clickForNextModel(id);
            $("#finish").off("click");
            $('#finish').click(() => {
                clickToFinish(id, cb, dataObj);
            });
        });
    }

    const clickForNextModel = (id) => {
        const dataObj = {
            name: $('#plyName').val(),
            image: $('#plyUrl').val()
        }
        if (id) {
            ajaxRequest('post', '/' + id, (data) => init(), dataObj);
        }
        return dataObj;
    }

    const clickToFinish = (id, cb, dataObj) => {
        let songsObj = { songs: JSON.stringify(makeSongsArr($('.songUrl'), $('.songName'))) };
        if (id) {
            return ajaxRequest('post', '/' + id + '/songs', () => init(), songsObj);
        }
        Object.assign(dataObj, songsObj);
        ajaxRequest('post', '', (data) => {
            init();
            dataObj['songs'] = JSON.parse(dataObj['songs']);
            dataObj['id'] = data.id;
            return cb(dataObj)
        }, dataObj);

    }

    $('#searchBar').keyup(() => {
        const searchVal = $('#searchBar').val().toLowerCase();
        if (!searchVal) {
            init();
        }
        const tempDataObjArr = [];
        for (let i in g_AllPlaylistObjArray) {
            let dataName = g_AllPlaylistObjArray[i].name.toLowerCase();
            if (dataName.search(searchVal) != -1) {
                tempDataObjArr.push(g_AllPlaylistObjArray[i]);
            }
        }
        if (tempDataObjArr.length) {
            $('.main-playlist').empty();
            tempDataObjArr.forEach(x => appending(x));
        }
    })

    init();
});