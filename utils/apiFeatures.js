class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // Filtering
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);
    // Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    console.log(JSON.parse(queryStr));
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    // Sorting
    console.log(this.queryString);
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      console.log(sortBy);
      this.query = this.query.sort(sortBy);
    } else {
      // Add minus sign to sort by descending order
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    // Field limiting
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      console.log(fields);
      this.query = this.query.select(fields);
    } else {
      // Exclude __v field by default
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    // Pagination
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;

    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = ApiFeatures;
