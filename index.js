const searchMovieBar = document.getElementById("search-movie-bar")
const suggestionList = document.getElementById("suggestions")
const searchMovieBtn = document.getElementById("search-movie-btn")
const mainContent = document.getElementById("main-content")
const watchListBtn = document.getElementById("watch-list-btn")
const searchMovieSec = document.getElementById("search-movie-sec")
const watchListSec = document.getElementById("my-movies-sec")
const searchSecBtn = document.getElementById("go-to-search")
const pageNumber = document.getElementById("page-number")
const searchMyListBar = document.getElementById("search-my-list-bar")
const nextBtn = document.getElementById("next-btn")
const prevBtn = document.getElementById("prev-btn")
const bottomBtns = document.getElementById("bottom-btns")
const backBtn = document.getElementById("back-btn")
let myWatchListArr
watchListSec.style.display ="none"
let movieWatchList = JSON.parse(localStorage.getItem("watchlist"))
const moviesPerPage = 10
const maxMoviesInWlPerPage = 4
let pageNum 
let currentSearch
let currentSection
const disableBtnAtStart =(btn1,btn2, state)=>{
    pageNum = 0
    backBtn.style.display ='none'
    pageNumber.innerHTML = pageNum
    btn1.disabled = state
    btn2.disabled = state
    currentSection = "searchSec"
}
const refreshSuggestionList = ()=>{
    suggestionList.innerHTML =" "
}
disableBtnAtStart(nextBtn,prevBtn,true)
refreshSuggestionList()
// Checks local storage
if(!movieWatchList){
    localStorage.setItem("watchlist",JSON.stringify([]))
    myWatchListArr = []

}else{
    myWatchListArr = movieWatchList
}
// functions using the API
const mainApi = async (val,type,page)=>{
    try {
        const res = await fetch(`/api/omdb/info/?apikey=9a2cb7fc&${type}=${val}&page=${page}`)
        if(!res.ok){
            throw new Error("fetch request was not okay")
        }
        const data = await res.json() //if the response was not ok then this code won't execute.
        return data
    }
    catch(error){
        console.error("failed to get API:", error)
        return {Response:"False"}
    }  
}
const mainPoster = (val)=>{
    const res = `/api/omdb/img/?apikey=9a2cb7fc&i=${val}`
    return res
}
///Search movies by title
const searchMovies = (title,page =1) => mainApi(title, "s",page)
//search by id to get details
const getMovieDetails =(id)=>mainApi(id, "i")
const changeBtnType=(sec)=>{
    if(sec =="searchSec"|| sec =="watchListSec"){
        bottomBtns.style.display ='flex'
        backBtn.style.display ='none'
    }else if(sec== "aboutSec"){
        bottomBtns.style.display ='none'
        backBtn.style.display ='flex'
    } 
  }
///Function that updates HTML
const updateHtml =(container,newHtml)=>{
    container.innerHTML = newHtml 
    changeBtnType(currentSection)
    if(pageNum){
        pageNumber.innerHTML = pageNum
}
    
}
//updates button properties based on if it is in watchlist or not
const updateBtnProperties = (isInWatchList)=>{
    if(isInWatchList){
        return {
            inOrNot:"added",
            btnText:"Movie already Added",
        }
    }else{
        return{
            inOrNot:"not-in",
            btnText:"Add Movie",
        }
    }
}
//switches class of section
const toggleClass =(content,add,rem)=>{
    content.classList.add(add)
    content.classList.remove(rem)
    }
    //Function that genetates html 
const generateMovieHtml = async (list,type) =>{
    let htmlString =""
    const htmlStringArray = await Promise.all(list.map(async(movie)=>{
        /*Because the map method does not wait for asynchronous operations like 
const movieInfo = await getMovieDetails(imdbID) needing async, we need to use Promise all.
By wrapping map with promise all we make so all the promises inside the array of the map()method
finish. Then promise.all() returns an array with promises as a single promise that resolves once each of the
promises in the array resolves.
        */
        const {Title: title,pic,imdbID} = movie
        const posterURL = mainPoster(imdbID)
        const movieInfo = await getMovieDetails(imdbID)
        const plot = movieInfo.Plot
        const inList = myWatchListArr.some(m => m.imdbID == imdbID)
        const btnProps = updateBtnProperties(inList)
        const {inOrNot,btnText} = btnProps
        if(type == "watchListHtml"){
            toggleClass(mainContent,"watch-style","search-style")
            htmlString =
            `<div class="watch-list-movies flex-colum">
            <h2>${title}</h2>
            <img src="${pic}"/>
                <div class="watchlist-movie">
                    <button data-about="${imdbID}"data-info="${imdbID}">About</button>
                    <button data-dcode="${imdbID}">Remove movie</button>
                </div>
            </div>`
        }else if(type =="suggestions"){
           htmlString=`
           <option value ="${title}"></option>
           ` 
        }else if(type =="searchResults"){
            toggleClass(mainContent,"search-style","watch-style")
             htmlString =`
             <div class="movies-in-res flex-colum">
                <h2>${title}</h2>
                <img src="${posterURL}"/>
                    <div class="poster-info flex-colum pad-five">
                        <p>${plot}</p>
                        <button id="${imdbID}" data-idd="${imdbID}" data-onoff="${inOrNot}"data-poster="${posterURL}" class="add-movie-btn pad-five ${inOrNot}">${btnText}</button>
                    </div>
             </div>
             `
        }
    return htmlString
    }))
    return htmlStringArray.join("")
}
// Functions for the movie search bar using API which renders the suggestions
searchMovieBar.addEventListener("input", async ()=>{
    const movieVal = searchMovieBar.value
        if(movieVal.length > 2){
            const searchRes = await searchMovies(movieVal)
            refreshSuggestionList()
                if(searchRes.Response == "True"){
                    const searchList = searchRes.Search.slice(0,5)
                    const html = await generateMovieHtml(searchList,"suggestions")
                    updateHtml(suggestionList,html)
            }
        }else if(movieVal.length < 2) {
            refreshSuggestionList()
        }
})
///functions that handle page number
//The 2 functions below disable or enable the next and prev buttons depending how many pages they have.
const toggleBtnState =(state = false,btn)=>{
    btn.disabled = state
}
const checkPageNum =(response,pageNum) =>{
    ///If another page exists after the current one, the next button is enabled
    if(response =="True" || response == true){
        toggleBtnState(false,nextBtn)
    }else if(response =="False" || response == false){
        //if another page doesn't exist after the current one, the nextbtn is disabled
        toggleBtnState(true,nextBtn)
    }
    toggleBtnState(pageNum ==1,prevBtn) ///if the page num is 1 it will disable the prev button, 
    ///this is to prevent being able to go on page 0
}
//This function updates the page when you click next page
const updateSearchPage= async(list, name)=>{
//The const below check if a next page exists after the current one
    const totalPages = await searchMovies(name,pageNum +1)
    
    //go to checkpageNUM for explanarion
    checkPageNum(totalPages.Response,pageNum) ///configures the next and prev buttons
    const html = await generateMovieHtml(list.Search,"searchResults")
    updateHtml(mainContent,html)
    mainContent.scrollIntoView()
}
//Searches movie submitted in searchbar
searchMovieBtn.addEventListener("click",async()=>{
    pageNum = 1 
    currentSearch = searchMovieBar.value
    const searchM = await searchMovies(currentSearch)
    if(searchM.Response == "True"){
       updateSearchPage(searchM, currentSearch)  
    }
}
)
///Watchlist FUNCTIONS

//Function that renders Movies inside the user's watchlist
const renderWatchList = async (list)=>{
    const html =  await generateMovieHtml(list,"watchListHtml")
    updateHtml(mainContent,html)
}
const updateWatchList=()=>{
    localStorage.setItem("watchlist",JSON.stringify(myWatchListArr))
}
//this function divides the movies in watchlist into its pages, it also renders the watchlist
const divideWatchList = async()=>{
    const res = myWatchListArr.length/maxMoviesInWlPerPage
    const checkPg = res > pageNum ///returms true if res is greater than pagenum
     //check pg returns either true or false
    checkPageNum(checkPg,pageNum)//function toggles next and prev btns
    const indexStart = (pageNum -1) * maxMoviesInWlPerPage
    changeBtnType(currentSection)
    /* 
    0 * 4 = 0
    1 * 4 = 4
    */
   const indexEnd = indexStart + maxMoviesInWlPerPage
   const currentArr = myWatchListArr.slice(indexStart,indexEnd)
   if(currentArr.length >0){
    renderWatchList(currentArr)
   }else{
    updatePageNum("minus")
   }
}
const updateAndRenderWatchlist = ()=>{
    updateWatchList()
    divideWatchList()
}
const updateBtnProperties2=(button,text,classAdd,classRemove)=>{
    button.innerText = text
    button.classList.add(classAdd)
    button.classList.remove(classRemove)
}
const removeMovie= (val)=>{
    let chosenD
    myWatchListArr.forEach((flick,index) => {
    if(flick.imdbID == val){
         chosenD = index
         myWatchListArr.splice(chosenD,1)
            }
    //removes movie from watchlist
    updateWatchList()
                })
}
//function to add and remove movie from watchlist adn update buttons
const addRemoveMovie =async (e,img) =>{
    const currentBtn = document.getElementById(e)
    const moviePicked = await getMovieDetails(e)
    //to see if movie is in Watchlist
    if(img== "inside"){
        removeMovie(e)
        updateAndRenderWatchlist()
    }else{
       if(myWatchListArr.some(movie  => movie.imdbID == e)){
        removeMovie(e)
        updateBtnProperties2(currentBtn,"Add Movie","not-in","added")
       }else{
        moviePicked.pic = img
        myWatchListArr.push(moviePicked)//adds movie to watchlist
        updateBtnProperties2(currentBtn,"Remove Movie from Watchlist?","added","not-in")
        updateWatchList()
       }
    }
}
const updatePageNum =async(effect="")=>{
    if(pageNum < 1){
        pageNum = 1
    }else{
        if(effect == "minus"){
            pageNum--
        }else if(effect =="add"){
            pageNum++
        }
    }
    if(currentSection == "searchSec"){
        //Current search is the value in the search bar. 
        //In here we get the list of movies  again but from a different page dependig on the pageNum VAlue
        const searchAgain = await searchMovies(currentSearch,pageNum)
        if(searchAgain.Response == "True"){
        updateSearchPage(searchAgain, currentSearch)
        }
    }else if(currentSection =="watchListSec"){
        divideWatchList()
    }
}
const goToAboutPg=async(code)=>{
    toggleClass(mainContent,"about-page-style","watch-style")
    let movieAbout =""
    currentSection = "aboutSec"
    const movieSum = await getMovieDetails(code)
    const poster = mainPoster(code)
    const plot = movieSum.Plot
    const inList = myWatchListArr.some(m => m.imdbID == code)
    const btnProps = updateBtnProperties(inList)
    const {inOrNot,btnText} = btnProps
    movieAbout = `
            <div class="flex-colum left poster-info">
                <h2>${movieSum.Title}</h2>
                <img src="${poster}"/>
            </div>
            <div class="poster-info pad-five flex-colum">
                <p>${plot}</p>
                <button id="${code}" data-idd="${code}" data-poster="${poster}" class="add-movie-btn ${inOrNot} pad-five">${btnText}</button>
            </div>
    `
    mainContent.classList.remove("watch-style")
    updateHtml(mainContent,movieAbout)
    }
document.addEventListener("click",(e)=>{
 const currentId = e.target.id
    if(currentId =="prev-btn"){
        updatePageNum("minus")
    }else if(currentId =="next-btn"){
        updatePageNum("add")
    }else if(e.target.dataset.idd){
        addRemoveMovie(e.target.dataset.idd,e.target.dataset.poster)
    }else if(e.target.dataset.dcode){
        addRemoveMovie(e.target.dataset.dcode, "inside")
    }else if(e.target.dataset.about){
        goToAboutPg(e.target.dataset.about)
        }    
    })
searchMovieBar.setAttribute("autocomplete", "off");
//Functions to toggle between sections
const toggleSection =(hide,show, func) =>{
    hide.style.display = "none"
    show.style.display = "flex"
    func()
}
const toggleAndReset =(section)=>{
    changeBtnType(currentSection)
    if(section=="watchListBtn"){
        pageNum = 1
        toggleSection(searchMovieSec,watchListSec,divideWatchList)
    }else if(section =="searchSecBtn"){
        disableBtnAtStart(nextBtn,prevBtn,true)
        toggleSection(watchListSec,searchMovieSec,()=>mainContent.innerHTML = "")
    }
}
const updateSecAndToggleReset =(sec,btn) =>{
    currentSection = sec
    toggleAndReset(btn)
    }
watchListBtn.addEventListener("click",()=>{
    updateSecAndToggleReset("watchListSec","watchListBtn")
})
searchSecBtn.addEventListener("click",()=>{
    if(mainContent.classList.contains("about-page-style")){
        mainContent.classList.remove("about-page-style")
    }
    updateSecAndToggleReset("searchSec","searchSecBtn")
})
backBtn.addEventListener("click",()=>{
    toggleClass(mainContent,"watch-style","about-page-style")
    currentSection = "watchListSec"
    updatePageNum()
})