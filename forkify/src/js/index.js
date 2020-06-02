import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import * as recipeView from './views/recipeView';
import { elements, renderLoader, clearLoader } from './views/base';



/**Global state of the app
 * -Search object
 * -Current recipe object
 * -Shopping list object
 * -Liked recipes
 */

const state = {};


/**
 * Search Controller
 */

const controlSearch = async () => {
    //1.Get the query from the view

    const query = searchView.getInput();
    

    if(query) {
        //2. New Search object and add to state
        state.search = new Search(query);

        //3.Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();

        renderLoader(elements.searchRes);


        try{

            //4.Search for recipes
            await state.search.getResults();
            clearLoader();
            //5.Render the results on UI
    
            searchView.renderResults(state.search.result);
        } catch(err){
            alert('Something wrong with the search ....');
            clearLoader();
        }

    }

};

elements.searchForm.addEventListener('submit',e=>{
    e.preventDefault();
    controlSearch();
});



//Event delegation

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    // console.log(btn);
    if(btn){
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }

});



/**
 * Recipe Controller
 */

const controlRecipe = async () => {
    //Get ID from URL
    const id = window.location.hash.replace('#','');
    
    if(id){
        //Prepare the UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //Highlight the selected search item
        
        if(state.search)
            searchView.highlightSelected(id);

        //Create new recipe object
        state.recipe = new Recipe(id);


        try{
            //Get the recipe data and parse Ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();
    
            //Calculate servings and time
    
            state.recipe.calcTime();
            state.recipe.calcServings();
    
            //Render the recipe
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
                );
        }  catch(err){
            alert(err);
        }  

    }
}

// window.addEventListener('hashchange', controlRecipe);

// window.addEventListener('load', controlRecipe);


['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));


/**
 * List Controller
 */



const controlList = () => {
    //Create a list if ther is none yet
    if(!state.list) state.list = new List();

    //Add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });

}



//Handle delete and update list item events

elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;
    
    //Handle the delete button

    if(e.target.matches('.shopping__delete, .shopping__delete *')) {
        //Delete from state
        state.list.deleteItem(id);

        //Delete from UI
        listView.deleteItem(id);
    
    //Handle the count update
    } else if(e.target.matches('.shopping__count-value')){
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});




/**
 * Like Controller
 */

 //Testing
state.likes = new Likes();
likesView.toggleLikeMenu(state.likes.getNumLikes());

const controlLike = () => {
    if(!state.likes) state.likes = new Likes();
    const currentId = state.recipe.id;

    //User has not yet liked current recipe
    if(!state.likes.isLiked(currentId)){
        //Add like to the state
        const newLike = state.likes.addLike(
            currentId,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        //Toggle the like button
        likesView.toggleLikebtn(true);

        //Add like to UI list
        likesView.renderLike(newLike);
    

    //User has liked the current recipe
    } else {

        //Remove like from the state
        state.likes.deleteLike(currentId);
        //Toggle the like button
        likesView.toggleLikebtn(false);
        //Remove like from UI list
        likesView.deleteLike(currentId);

    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};


//Restore liked recipes on page load

window.addEventListener('load', () => {
    state.likes = new Likes();

    //Restore likes
    state.likes.readStorage();

    //Toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    //Render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
});




//Handling recipe button clicks

elements.recipe.addEventListener('click', e => {
    if(e.target.matches('.btn-decrease, .btn-decrease *')){
        // Decrease button is clicked
        if(state.recipe.servings > 1){
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }

    } else if(e.target.matches('.btn-increase, .btn-increase *')){
        // Increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
        
    } else if(e.target.matches('.recipe__btn--add , .recipe__btn--add *')) {
        //add ingredients to shopping list
        controlList();
    } else if(e.target.matches('.recipe__love, .recipe__love *')) {
        //Like Controller
        controlLike();
    }
});

