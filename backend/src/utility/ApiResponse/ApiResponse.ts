
export  class ApiResponse{
    statusCode : number
    message :string
    data: Object

    constructor(statusCode : number , data  : Object | {},message :string = "Sucess"){
        this.statusCode = statusCode,
        this.message = message,
        this.data = data  
        
    }
}
