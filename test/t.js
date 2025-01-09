const express = require("express");
const router = express.Router();
const path = require("path");
const exphbs = require("express-handlebars");
const collection = require("./mongodb");
const nodemailer = require("nodemailer");
const collectionCamp = require("./campdb");
const collectionRequest = require("./requestdb");

const templatePath = path.join(__dirname, "../src/page");


router.use(express.json());
router.use(express.urlencoded({ extended: false }));
router.use(express.static('public'));
router.get("/admindonor", (req, res) => {
  res.render("admindonor");
});

router.get("/adminhome", async (req, res) => {
  console.log("entered login_verify");
  const bloodcollection = {
    a_p: await collection.countDocuments({ bloodGroup: "A+" }),
    a_n: await collection.countDocuments({ bloodGroup: "A-" }),
    b_p: await collection.countDocuments({ bloodGroup: "B+" }),
    b_n: await collection.countDocuments({ bloodGroup: "B-" }),
    ab_p: await collection.countDocuments({ bloodGroup: "AB+" }),
    ab_n: await collection.countDocuments({ bloodGroup: "AB-" }),
    o_p: await collection.countDocuments({ bloodGroup: "O+" }),
    o_n: await collection.countDocuments({ bloodGroup: "O-" }),
  };
  try {
    const data = await collection.aggregate([
      { $group: { _id: "$bloodGroup", count: { $sum: 1 } } },
    ]);
    console.log(data);
    const labels = JSON.stringify(data.map((item) => item._id));
    const values = JSON.stringify(data.map((item) => item.count));
    res.render("adminhome", { bloodGroups: bloodcollection, labels, values });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});
router.get("/admincamp", (req, res) => {
  res.render("admincamp");
});

router.post("/showinfo", async (req, res) => {
  try {
    let userData;
    const dis = req.body.district;
    const blood = req.body.bloodGroup;
    const filter = { district: dis };
    if (blood || dis) {
      if (blood) {
        filter.bloodGroup = blood;
      }

      const users = await collection.find(filter);
      userData = users.map((user) => {
        return {
          name: user.name,
          district: user.district,
          phno: user.phno,
          bloodGroup: user.bloodGroup,
          age: user.age,
          email: user.email,
        };
      });
    } else {
      const users = await collection.find({});
      userData = users.map((user) => {
        return {
          name: user.name,
          district: user.district,
          phno: user.phno,
          bloodGroup: user.bloodGroup,
          age: user.age,
          email: user.email,
        };
      });
      console.log(userData);
    }

    res.render("admindonor", { users: userData });
  } catch (error) {
    console.error(error);
    res.render("admindonor", { message: "An error occurred!" });
  }
});
router.get("/adminrequest", (req, res) => {
  res.render("adminrequest");
});

router.post("/admincampmail", async (req, res) => {
  try {
    console.log(`entered`);
    const dataCamp = {
      district: req.body.district,
      phno: req.body.phno,
      place: req.body.place,
      date: req.body.date,
    };
    if (dataCamp) {
      await collectionCamp.insertMany([dataCamp]);
      console.log(`Success New Camp ${dataCamp}`);
    }
    console.log(dataCamp.district);
    const users = await collection.find({ district: dataCamp.district });
    // users.forEach((user) => {
    //   (user.district = user.district.toUpperCase()),
    //     (user.name = user.name.toUpperCase());
    // });
    const userData = users.map((user) => ({
      email: user.email,
    }));

    console.log(userData);

    if (userData.length > 0) {
      let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "www.sriramram173@gmail.com",
          pass: "ssae beyo iymv racl",
        },
      });

      userData.forEach((user) => {
        let mailOptions = {
          from: process.env.EMAIL,
          to: user.email,
          subject: "CAMP ALERT",
          text: "Camp at " + dataCamp.district,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Error sending email:", error);
          } else {
            console.log("Email sent:", info.response);
          }
        });
      });
    }

    res.render("admincamp", { users: users });
  } catch (error) {
    console.error("An error occurred:", error);
    res.render("admincamp", { message: "An error occurred!" });
  }
});

router.get("/edit", async (req, res) => {
  const users = await collection.find();
  console.log("show window opened");
  // const editUser = await collection.findOne({ _id: req.query.edit_id });
  // res.render("edit", { edit: users, edituser: editUser });
  console.log(users);
});

router.get("/update_info/:id", async (req, res) => {
  const id = req.params.id;
  console.log("enter into object finder");
  const name = req.query.name;
  const phnos = req.query.phno;
  try {
    const result = await collection.updateOne(
      { _id: id },
      { $set: { name: name, phno: phnos } }
    );
    console.log("Update result:", result);
    // res.status(200).send("Update successful");
  } catch (error) {
    console.error("Update error:", error);
    // res.status(500).send("Update failed");
  }
});

// router.get("/admincampdetail",async (req,res)=>{
//   let camp=await collectionCamp.find({})
//   console.log(camp)
//   res.render("admincampdetail",{camp:camp})

// })
router.get("/admincampdetail", async (req, res) => {
  let camps = await collectionCamp.find({});
  let campDetails = camps.map((camp) => {
    let morningCount = camp.response.Morning.length;
    let afternoonCount = camp.response.Afternoon.length;
    let eveningCount = camp.response.Evening.length;
    let place = camp.place;
    let date = camp.date;
    let district = camp.district;
    let phno = camp.phno;
    return {
      _id: camp._id,
      morningCount: morningCount,
      afternoonCount: afternoonCount,
      eveningCount: eveningCount,
      place: place,
      date: date,
      district: district,
      phno: phno,
    };
  });
  // const campDetail =   JSON.stringify(campDetails.map((item) => item.response));
  // console.log(campDetail);
  // console.log(campDetails);
  res.render("admincampdetail", { camp: campDetails });
});

router.post("/adminRequest", async (req, res) => {
  const data = {
    H_name: req.body.H_name,
    H_address: req.body.H_address,
    H_district: req.body.H_district,
    P_id: req.body.P_id,
    phno: req.body.phno,
    date_need: req.body.date_need,
    blood_group: req.body.blood_group,
  };

  try {
    const result = await collectionRequest.insertMany([data]);
    const reqMail = await collection.find({ district: req.body.H_district });
    console.log(reqMail);
    console.log(result);

    const userData = reqMail.map((user) => ({
      email: user.email,
    }));

    console.log(userData);

    if (userData.length > 0) {
      let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "www.sriramram173@gmail.com",
          pass: "ssae beyo iymv racl",
        },
      });

      userData.forEach((user) => {
        let mailOptions = {
          from: process.env.EMAIL,
          to: user.email,
          subject: "Emergency Alert",
          text: `Dear Donor,
        
          There is an urgent need for blood at ${req.body.H_name} located at ${req.body.H_address}, ${req.body.H_district}. Patient ID: ${req.body.P_id} requires blood on ${req.body.date_need}.
          
          Your willingness to donate blood can save a life. Please contact ${req.body.phno} for more information and to schedule a donation appointment.
          
          Thank you for your kindness and willingness to help those in need.
        
          Best regards,
          Blood Share HUB Team`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Error sending email:", error);
          } else {
            console.log("Email sent:", info.response);
          }
        });
      });
    }
  } catch (error) {
    console.error("Error:", error);
  }

  res.redirect("/");
});


router.get("/adminRequestManage", async (req, res) => {
  const donor=await collectionRequest.find({});
  res.render("adminRequestManage",{donor})
});


router.post("/adminRequestManage/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const request = await collectionRequest.deleteOne({_id:id})
    console.log(request);
  } catch (err) {
    console.error("Error updating request:", err);
  }
});
// router.get("/requestinfo", async (req, res) => {
//   // try {
//   //   const id = req.params.id;
//   //   const data = await collectionRequest.findOne({_id: id }, { response_id: 1 });
//   //   console.log(data);

//   //   if (!data) {
//   //     return res.status(404).json({ message: "Request not found" });
//   //   }

//   //   const hero = await collection.findOne({ _id: data.response_id });
//   //   console.log(hero);

//   //   res.render("adminRequestManage", { hero });
//   // } catch (error) {
//   //   console.error(error);
//   //   res.status(500).json({ message: "Internal server error" });
//   // }
//   res.render("home");
// });
router.get("/requestinfo/:id", async (req, res) => {
    const id = req.params.id;
    const data = await collectionRequest.findOne({_id: id }, { response_id: 1 });
    const hero = await collection.findOne({ _id: data.response_id });
    console.log(hero);
    // res.status(400).json({ message: "The Amenities exists" });
    res.render("")
});
// router.get("/requestinfo", async (req, res) => {
//   res.render("home")
// });




module.exports = {
  router,
  async test(req, res) {
    try {
      const id = req.params.id;
    const data = await collectionRequest.findOne({_id: id }, { response_id: 1 });
    const hero = await collection.findOne({ _id: data.response_id }); 
      return res.redirect(`/admin/adminRequestManage?hero=${hero.id}`);
    } catch (error) {
      console.log(error)
      return res.send('Erro no banco de dados!')
    }
  }
}


