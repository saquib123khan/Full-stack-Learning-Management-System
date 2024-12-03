import {Schema, model} from 'mongoose'

const courseSchema = new Schema({
    title:{
        type: String,
        required: [true, 'Title is required'],
        minlenght: [8, 'Title must be atleast 8 characters'],
        maxlenght: [60, 'Title should be less than 60 characters'],
        trim: true
    },
    description:{
        type: String,
        required: [true, 'description is required'],
        minlenght: [8, 'Title must be atleast 8 characters'],
        maxlenght: [200, 'description should be less than 200 characters']
    },
    category:{
        type: String,
        required: [true, 'Category is required']
    },
    thumbnail:{
        public_id:{
            type: String,
            required: true
        },
        secure_url:{
            type: String,
            required: true
        }
    },
    lectures:[
        {
            title: String,
            description: String,
            lectures:{
                public_id:{
                    type: String,
                    required: true
                },
                secure_url:{
                    type: String,
                    required: true
                }
            }

        }
    ],
    numbersOflectures:{
        type: Number,
        default: 0
    },
    createdBy:{
        type: String,
        
    }
},{
    timestamps:true
})

const Course = model('Course', courseSchema)

export default Course