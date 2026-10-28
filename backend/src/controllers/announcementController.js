import Announcement from '../models/Announcement.js';

/**
 * @desc    Get all announcements with search, category filtering, sorting, and pagination
 * @route   GET /api/announcements
 * @access  Public
 */
export const getAnnouncements = async (req, res, next) => {
  try {
    const {
      search,
      category,
      sort = 'newest',
      page = 1,
      limit = 10,
    } = req.query;

    // Build MongoDB query filter
    const query = {};

    // 1. Category filter
    if (category && category.trim() !== '') {
      const validCategories = ['Academics', 'Examinations', 'Events', 'General'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category '${category}'. Valid categories are: ${validCategories.join(', ')}`,
        });
      }
      query.category = category;
    }

    // 2. Keyword search on title and description
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
      ];
    }

    // 3. Sorting logic
    // Pinned announcements always appear at the top, followed by date sorting
    const sortDirection = sort.toLowerCase() === 'oldest' ? 1 : -1;
    const sortOptions = {
      pinned: -1,
      publishedAt: sortDirection,
      _id: sortDirection, // Stable secondary sort
    };

    // 4. Pagination calculations
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNumber - 1) * limitNumber;

    // Execute query with count
    const [total, announcements] = await Promise.all([
      Announcement.countDocuments(query),
      Announcement.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNumber),
    ]);

    const totalPages = Math.ceil(total / limitNumber);

    res.status(200).json({
      success: true,
      message: 'Announcements retrieved successfully',
      data: announcements,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single announcement by ID
 * @route   GET /api/announcements/:id
 * @access  Public
 */
export const getAnnouncementById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: `Announcement not found with ID: ${id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Announcement retrieved successfully',
      data: announcement,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new announcement
 * @route   POST /api/announcements
 * @access  Protected (Admin only)
 */
export const createAnnouncement = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      publishedAt,
      deadline,
      sourceUrl,
      attachmentUrl,
      pinned,
    } = req.body;

    const newAnnouncement = new Announcement({
      title,
      description,
      category,
      publishedAt: publishedAt || Date.now(),
      deadline: deadline || null,
      sourceUrl: sourceUrl || null,
      attachmentUrl: attachmentUrl || null,
      pinned: typeof pinned === 'boolean' ? pinned : false,
    });

    const savedAnnouncement = await newAnnouncement.save();

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: savedAnnouncement,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an announcement by ID
 * @route   PUT /api/announcements/:id
 * @access  Protected (Admin only)
 */
export const updateAnnouncement = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    const existingAnnouncement = await Announcement.findById(id);
    if (!existingAnnouncement) {
      return res.status(404).json({
        success: false,
        message: `Announcement not found with ID: ${id}`,
      });
    }

    const {
      title,
      description,
      category,
      publishedAt,
      deadline,
      sourceUrl,
      attachmentUrl,
      pinned,
    } = req.body;

    // Apply updates if provided in request body
    if (title !== undefined) existingAnnouncement.title = title;
    if (description !== undefined) existingAnnouncement.description = description;
    if (category !== undefined) existingAnnouncement.category = category;
    if (publishedAt !== undefined) existingAnnouncement.publishedAt = publishedAt;
    if (deadline !== undefined) existingAnnouncement.deadline = deadline;
    if (sourceUrl !== undefined) existingAnnouncement.sourceUrl = sourceUrl;
    if (attachmentUrl !== undefined) existingAnnouncement.attachmentUrl = attachmentUrl;
    if (pinned !== undefined) existingAnnouncement.pinned = pinned;

    const updatedAnnouncement = await existingAnnouncement.save();

    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      data: updatedAnnouncement,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an announcement by ID
 * @route   DELETE /api/announcements/:id
 * @access  Protected (Admin only)
 */
export const deleteAnnouncement = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    const announcement = await Announcement.findByIdAndDelete(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: `Announcement not found with ID: ${id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully',
      data: {
        id: announcement._id,
        title: announcement.title,
      },
    });
  } catch (error) {
    next(error);
  }
};
