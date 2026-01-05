
const Listing=require("../models/listing");


module.exports.index= async (req,res) => {
    const allListings= await Listing.find({});
    console.log(allListings);
    res.render("listings/index.ejs",{ allListings });
};

module.exports.renderNewForm = (req,res) => {
res.render("listings/new.ejs");
};

module.exports.showListing=async(req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id).populate({
        path:"reviews",
        populate:{
            path:"author",
        },
    })
        .populate("owner");
    if(!listing){
        req.flash("error","This listing does not exist");
        return res.redirect("/listings");
    }
    console.log(listing);
    res.render("listings/show.ejs",{ listing });
};

module.exports.createListing = async (req, res, next) => {
    console.log("Inside createListing");
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);
    try {
        const newListing = new Listing(req.body.listing);

        if (req.user && req.user._id) {
            newListing.owner = req.user._id;
        } else {
            console.log("⚠ No user found in request.");
        }

        if (req.file) {
            newListing.image = {
                url: req.file.path,
                filename: req.file.filename
            };
        } else {
            console.log("⚠ No file found in request.");
        }

        await newListing.save();
        console.log(" Listing saved:", newListing);
        req.flash("success", "New Listing Created!");
        res.redirect("/listings");

    } catch (err) {
        console.error(" Error creating listing:", err);
        res.status(500).send("Error while creating listing.");
    }
};

 module.exports.renderEditForm=async(req,res)=>{
     let { id }=req.params;
     const listing=await Listing.findById(id);
 if(!listing){
         req.flash("error","This listing does not exist");
       return  res.redirect("/listings");
     }

     let originalImageUrl = listing.image.url;
     originalImageUrl = originalImageUrl.replace("/upload","/upload/w_250");
     res.render("listings/edit.ejs",{ listing, originalImageUrl});
 };

 module.exports.updateListing=async(req,res)=>{
     let {id}=req.params;
    let listing = await Listing.findByIdAndUpdate(id,{ ...req.body.listing });
    if(typeof req.file !== "undefined"){
     let url=req.file.path;
    let filename = req.file.filename;
    listing.image={ url, filename };
    await listing.save();
    }
    req.flash("success","Listing Updated!");  
    res.redirect(`/listings/${id}`);
 };

 module.exports.destroyListing=async(req,res)=>{
     let {id}=req.params;
    let deletedListing=await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success","Listing Deleted!")
    res.redirect("/listings");
 };
