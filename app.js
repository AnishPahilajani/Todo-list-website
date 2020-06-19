const express = require("express");
const https = require("https");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const _ = require("lodash");


const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));

// var items = [];
// var workList = [];

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const itemsSchema = new mongoose.Schema({  // Schema
  name: String
});

const Item = mongoose.model("Item", itemsSchema); // model

const item1 = new Item({  // docs
  name: "Welcome to your todo list"
});

const item2 = new Item({ // docs
  name: "hit the + button to add new items"
});

const item3 = new Item({// docs
  name: "<-- hit this button to delete"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({    // Schema
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema); // model




app.get("/", function (req, res) {

    Item.find({}, function (err, foundItems) {
        if (foundItems.length === 0 ){
            Item.insertMany(defaultItems, function (err) {
              if (err) {
                console.log(err);
              } else {
                console.log("added to db successfully");
              }
            });
            res.redirect("/")
        } else {
                  res.render("list", {
                    listTitle: "Today",
                    newListitem: foundItems,
                  });

        }
    });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function (err, foundList) {
    if(!err){
        if (!foundList){
            //Create new list
            const list = new List({
            name: customListName,
            items: defaultItems
            });
            list.save();
            res.redirect("/" + customListName)
        }else{
            //show existing list
            res.render("list", {
              listTitle: foundList.name,
              newListitem: foundList.items
            });
        }
    }
  })

});


app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({         // docs
      name: itemName
    });

    if (listName === "Today"){
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}, function (err, foundList) {
            foundList.items.push(item)
            foundList.save()
            res.redirect("/" + listName);
        })
        
        
    }

    
    // if (req.body.list === "Work"){
    //     workList.push(item);
    //     res.redirect("/work");
    // } else {
    //     items.push(item)
    //     res.redirect("/");
    // }
});


app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    console.log(listName)
    if (listName === "Today"){
        Item.findByIdAndRemove(checkedItemId, function (err) {
          if (!err) {
            console.log("Delelted successfully");
            res.redirect("/");
          }
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function (err, foundList) {
            if(!err){
                res.redirect("/"+listName);
            }
            
        });
    }
    
});






app.listen(3000, function () {
    console.log("Server is running on port 3000");
});